const Candidate = require('../models/Candidate');
const JobRequisition = require('../models/JobRequisition');



// 🔧 Helper: Build Job Match Filter
const buildJobMatch = (query) => {
  const match = {};
  if (query.type && query.type !== 'All') {
    if (query.type === 'White Collar') {
      match.type = 'White Collar';
    } else if (query.type.startsWith('Blue Collar')) {
      match.type = 'Blue Collar';
      if (query.type.includes('Sewer')) match.subType = 'Sewer';
      if (query.type.includes('Non-Sewer')) match.subType = 'Non-Sewer';
    }
  }
  if (query.department) match.departmentId = query.department;
  if (query.jobRequisitionId) match._id = query.jobRequisitionId;
  return match;
};


const buildCandidateMatch = (query) => {
  const match = {};
  if (query.recruiter) match.recruiter = query.recruiter;
  if (query.jobRequisitionId) match.jobRequisitionId = query.jobRequisitionId;

  if (query.start || query.end) {
    match['progressDates.Application'] = {};
    if (query.start) match['progressDates.Application'].$gte = new Date(query.start);
    if (query.end) match['progressDates.Application'].$lte = new Date(query.end);
  }

  return match;
};


exports.getDashboardStats = async (req, res) => {
  try {
    const jobMatch = buildJobMatch(req.body);
    const candidateMatch = buildCandidateMatch(req.body);

    const jobRequisitions = await JobRequisition.find(jobMatch);
    const jobIds = jobRequisitions.map(j => j._id);
    candidateMatch.jobRequisitionId = { $in: jobIds };
    const candidates = await Candidate.find(candidateMatch);

    const stages = ['Application', 'ManagerReview', 'Interview', 'JobOffer', 'Hired', 'Onboard'];
    const pipeline = Object.fromEntries(stages.map(stage => [stage, 0]));
    const monthly = {};
    const source = {};
    const decision = {
      'Hired': 0,
      'Candidate in Process': 0,
      'Candidate Refusal': 0,
      'Not Hired': 0
    };

    let totalDaysToHire = 0;
    let onboardedCount = 0;

    candidates.forEach(c => {
      const pd = c.progressDates || {};
      const appDate = new Date(pd.Application);
      const key = `${appDate.getFullYear()}-${String(appDate.getMonth() + 1).padStart(2, '0')}`;
      monthly[key] = (monthly[key] || 0) + 1;

      source[c.applicationSource] = (source[c.applicationSource] || 0) + 1;
      if (decision[c.hireDecision] !== undefined) decision[c.hireDecision]++;
      if (pipeline[c.progress] !== undefined) pipeline[c.progress]++;

      let days = 0;
      let isComplete = true;
      for (let i = 1; i < stages.length; i++) {
        const prev = pd[stages[i - 1]];
        const curr = pd[stages[i]];
        if (!prev || !curr) {
          isComplete = false;
          break;
        }
        const gap = Math.ceil((new Date(curr) - new Date(prev)) / (1000 * 60 * 60 * 24));
        days += Math.max(0, gap);
      }
      if (isComplete) {
        totalDaysToHire += days;
        onboardedCount++;
      }
    });

    const totalCost = jobRequisitions.reduce((sum, j) => sum + (j.hiringCost || 0), 0);
    const onboarded = jobRequisitions.reduce((sum, j) => sum + (j.onboardCount || 0), 0);
    const filled = jobRequisitions.filter(j => j.status === 'Filled').length;
    const activeVacancies = jobRequisitions.filter(j => j.status === 'Vacant').length;
    const costPerHire = onboarded > 0 ? Number((totalCost / onboarded).toFixed(2)) : null;
    const fillRate = jobRequisitions.length ? ((filled / jobRequisitions.length) * 100).toFixed(1) : 0;
    const avgDaysToHire = onboardedCount ? (totalDaysToHire / onboardedCount).toFixed(1) : '-';

    res.json({
      totalRequisitions: jobRequisitions.length,
      filledPositions: filled,
      activeVacancies,
      hiringCost: totalCost,
      costPerHire,
      avgDaysToHire,
      fillRate,
      monthly: {
        labels: Object.keys(monthly),
        counts: Object.values(monthly)
      },
      source,
      decision,
      pipeline
    });

  } catch (err) {
    console.error('❌ Dashboard error:', err);
    res.status(500).json({ message: 'Dashboard fetch error', error: err.message });
  }
};



// ✅ GET /api/dashboard/summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const jobMatch = buildJobMatch(req.query);
    const candidateMatch = buildCandidateMatch(req.query);

    const jobs = await JobRequisition.find(jobMatch);
    const jobIds = jobs.map(j => j._id);
    candidateMatch.jobRequisitionId = { $in: jobIds };

    const candidates = await Candidate.find(candidateMatch);

    const hired = candidates.filter(c => c.hireDecision === 'Hired').length;
    const cost = jobs.reduce((acc, j) => acc + (j.hiringCost || 0), 0);
    const costPerHire = hired ? (cost / hired).toFixed(2) : '-';

    const filled = jobs.filter(j => j.status === 'Filled').length;
    const activeVacancies = jobs.filter(j => j.status === 'Vacant').length;
    const fillRate = jobs.length ? ((filled / jobs.length) * 100).toFixed(1) : 0;

    res.json({
      hiringCost: cost,
      costPerHire,
      activeVacancies,
      fillRate
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch dashboard summary', error: err.message });
  }
};

// ✅ GET /api/dashboard/monthly
exports.getMonthlyApplications = async (req, res) => {
  try {
    const jobMatch = buildJobMatch(req.query);
    const candidateMatch = buildCandidateMatch(req.query);

    const jobs = await JobRequisition.find(jobMatch);
    const jobIds = jobs.map(j => j._id);
    candidateMatch.jobRequisitionId = { $in: jobIds };

    const candidates = await Candidate.find(candidateMatch);

    const monthly = {};
    candidates.forEach(c => {
      const date = new Date(c.progressDates.Application);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthly[key] = (monthly[key] || 0) + 1;
    });

    res.json(monthly);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch monthly data', error: err.message });
  }
};

// ✅ GET /api/dashboard/sources
exports.getApplicationSources = async (req, res) => {
  try {
    const jobMatch = buildJobMatch(req.query);
    const candidateMatch = buildCandidateMatch(req.query);

    const jobs = await JobRequisition.find(jobMatch);
    const jobIds = jobs.map(j => j._id);
    candidateMatch.jobRequisitionId = { $in: jobIds };

    const candidates = await Candidate.find(candidateMatch);

    const sources = {};
    candidates.forEach(c => {
      sources[c.applicationSource] = (sources[c.applicationSource] || 0) + 1;
    });

    res.json(sources);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch source data', error: err.message });
  }
};
exports.getRecruitmentPipeline = async (req, res) => {
  try {
    const jobMatch = buildJobMatch(req.query);
    const candidateMatch = buildCandidateMatch(req.query);

    const jobs = await JobRequisition.find(jobMatch);
    const jobIds = jobs.map(j => j._id);
    candidateMatch.jobRequisitionId = { $in: jobIds };

    const candidates = await Candidate.find(candidateMatch);

    const stages = ['Application', 'ManagerReview', 'Interview', 'JobOffer', 'Hired', 'Onboard'];
    const pipeline = Object.fromEntries(stages.map(stage => [stage, 0]));

    candidates.forEach(c => {
      if (!c.progressDates) return;
      stages.forEach(stage => {
        if (c.progressDates[stage]) {
          pipeline[stage] += 1;
        }
      });
    });

    res.json(pipeline);
  } catch (err) {
    console.error('❌ Pipeline error:', err);
    res.status(500).json({ message: 'Failed to fetch pipeline data', error: err.message });
  }
};



// ✅ GET /api/dashboard/decisions
exports.getFinalDecisions = async (req, res) => {
  try {
    const jobMatch = buildJobMatch(req.query);
    const candidateMatch = buildCandidateMatch(req.query);

    const jobs = await JobRequisition.find(jobMatch);
    const jobIds = jobs.map(j => j._id);
    candidateMatch.jobRequisitionId = { $in: jobIds };

    const candidates = await Candidate.find(candidateMatch);

    const decisions = {
      'Hired': 0,
      'Candidate in Process': 0,
      'Candidate Refusal': 0,
      'Not Hired': 0
    };

    candidates.forEach(c => {
      decisions[c.hireDecision] = (decisions[c.hireDecision] || 0) + 1;
    });

    res.json(decisions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch decision data', error: err.message });
  }
};

// ✅ GET /api/dashboard/kpis

// ✅ Main Dashboard KPI Endpoint
exports.getDashboardStats = async (req, res) => {
  try {
    const jobMatch = buildJobMatch(req.body);
    const candidateMatch = buildCandidateMatch(req.body);

    const jobRequisitions = await JobRequisition.find(jobMatch);
    const jobIds = jobRequisitions.map(j => j._id);
    candidateMatch.jobRequisitionId = { $in: jobIds };
    const candidates = await Candidate.find(candidateMatch);

    const stages = ['Application', 'ManagerReview', 'Interview', 'JobOffer', 'Hired', 'Onboard'];
    const pipeline = Object.fromEntries(stages.map(stage => [stage, 0]));
    const monthly = {};
    const source = {};
    const decision = {
      'Hired': 0,
      'Candidate in Process': 0,
      'Candidate Refusal': 0,
      'Not Hired': 0
    };

    let totalDaysToHire = 0;
    let onboardedCount = 0;

    candidates.forEach(c => {
      const pd = c.progressDates || {};
      const appDate = new Date(pd.Application);
      const key = `${appDate.getFullYear()}-${String(appDate.getMonth() + 1).padStart(2, '0')}`;
      monthly[key] = (monthly[key] || 0) + 1;

      source[c.applicationSource] = (source[c.applicationSource] || 0) + 1;
      if (decision[c.hireDecision] !== undefined) decision[c.hireDecision]++;
      if (pipeline[c.progress] !== undefined) pipeline[c.progress]++;

      // Calculate days between Application → Onboard (if complete)
      let days = 0;
      let isComplete = true;
      for (let i = 1; i < stages.length; i++) {
        const prev = pd[stages[i - 1]];
        const curr = pd[stages[i]];
        if (!prev || !curr) {
          isComplete = false;
          break;
        }
        const gap = Math.ceil((new Date(curr) - new Date(prev)) / (1000 * 60 * 60 * 24));
        days += Math.max(0, gap);
      }
      if (isComplete) {
        totalDaysToHire += days;
        onboardedCount++;
      }
    });

    const totalCost = jobRequisitions.reduce((sum, j) => sum + (j.hiringCost || 0), 0);
    const onboarded = jobRequisitions.reduce((sum, j) => sum + (j.onboardCount || 0), 0);
    const filled = jobRequisitions.filter(j => j.status === 'Filled').length;
    const activeVacancies = jobRequisitions.filter(j => j.status === 'Vacant').length;

    // ✅ FIXED: Return null instead of '-' so frontend can format correctly
    const costPerHire = onboarded > 0 ? (totalCost / onboarded).toFixed(2) : null;
    const fillRate = jobRequisitions.length ? ((filled / jobRequisitions.length) * 100).toFixed(1) : 0;
    const avgDaysToHire = onboardedCount > 0 ? (totalDaysToHire / onboardedCount).toFixed(1) : '-';

    res.json({
      totalRequisitions: jobRequisitions.length,
      filledPositions: filled,
      activeVacancies,
      hiringCost: totalCost,
      costPerHire, // ✅ will show `$...` in frontend
      avgDaysToHire,
      fillRate,
      monthly: {
        labels: Object.keys(monthly),
        counts: Object.values(monthly)
      },
      source,
      decision,
      pipeline
    });

  } catch (err) {
    console.error('❌ Dashboard error:', err);
    res.status(500).json({ message: 'Dashboard fetch error', error: err.message });
  }
};


// ✅ GET /api/dashboard/kpis
exports.getVacancyKPIs = async (req, res) => {
  try {
    // Build filter for job type
    const match = {};
    if (req.query.type && req.query.type !== 'All') {
      if (req.query.type === 'White Collar') {
        match.type = 'White Collar';
      } else if (req.query.type.startsWith('Blue Collar')) {
        match.type = 'Blue Collar';
        if (req.query.type.includes('Sewer')) match.subType = 'Sewer';
        if (req.query.type.includes('Non-Sewer')) match.subType = 'Non-Sewer';
      }
    }

    // Fetch all matching job requisitions
    const jobs = await JobRequisition.find(match);

    const totalRequisitions = jobs.length;
    const filled = jobs.filter(j => j.status === 'Filled').length;
    const activeVacancies = jobs.filter(j => j.status === 'Vacant').length;

    const hiringCost = jobs.reduce((sum, j) => sum + (j.hiringCost || 0), 0);
    
    const onboarded = jobRequisitions.reduce((sum, j) => sum + (j.onboardCount || 0), 0);

    const costPerHire = onboarded > 0 ? Number((totalCost / onboarded).toFixed(2)) : '-';
    const fillRate = totalRequisitions > 0 ? ((filled / totalRequisitions) * 100).toFixed(1) : '0';

    res.json({
      totalRequisitions,
      filled,
      activeVacancies,
      hiringCost,
      costPerHire,
      fillRate
    });
  } catch (err) {
    console.error('❌ Error in getVacancyKPIs:', err);
    res.status(500).json({ message: 'Failed to fetch KPI data', error: err.message });
  }
};