const Candidate = require('../models/Candidate');
const JobRequisition = require('../models/JobRequisition');
const dayjs = require('dayjs');

exports.getDashboardStats = async (req, res) => {
  try {
    const { type, subType, from, to, recruiter, departmentId, year } = req.body;

    // 🎯 Candidate filter
    const filter = {};
    if (type) filter.type = type;
    if (subType) filter.subType = subType;
    if (recruiter) filter.recruiter = recruiter;

    if (from || to) {
      filter['progressDates.Application'] = {};
      if (from) filter['progressDates.Application'].$gte = new Date(from);
      if (to) filter['progressDates.Application'].$lte = new Date(to);
    }

    // 🎯 Handle department filter via job requisition
    if (departmentId) {
      const relatedRequisitions = await JobRequisition.find({ departmentId }).select('_id');
      const ids = relatedRequisitions.map(r => r._id);
      filter.jobRequisitionId = { $in: ids };
    }

    const candidates = await Candidate.find(filter);

    // ───────────────────────────────────────
    // 📊 Source Breakdown
    const sourceMap = {};
    for (const c of candidates) {
      const source = (c.applicationSource || '').trim();
      if (source) sourceMap[source] = (sourceMap[source] || 0) + 1;
    }
    const sources = {
      labels: Object.keys(sourceMap),
      counts: Object.values(sourceMap)
    };

    // ───────────────────────────────────────
    // 📊 Final Decisions
    const decisionMap = {
      Hired: 0,
      'Not Hired': 0,
      'Candidate Refused': 0,
      'Candidate in Process': 0
    };
    for (const c of candidates) {
      const decision = c.hireDecision || 'Candidate in Process';
      decisionMap[decision] = (decisionMap[decision] || 0) + 1;
    }
    const decisions = {
      labels: Object.keys(decisionMap),
      counts: Object.values(decisionMap)
    };

    // ───────────────────────────────────────
    // 📊 Pipeline
    const pipeline = {
      Application: 0,
      ManagerReview: 0,
      Interview: 0,
      JobOffer: 0,
      Hired: 0,
      Onboard: 0
    };
    for (const c of candidates) {
      const p = c.progressDates || {};
      if (p.Application) pipeline.Application++;
      if (p.ManagerReview) pipeline.ManagerReview++;
      if (p.Interview) pipeline.Interview++;
      if (p.JobOffer) pipeline.JobOffer++;
      if (p.Hired) pipeline.Hired++;
      if (p.Onboard) pipeline.Onboard++;
    }

    // ───────────────────────────────────────
    // 📈 Monthly Applications (independent)
    const yearQuery = year || new Date().getFullYear();
    const monthlyMap = {};

    const monthlyCandidates = await Candidate.find({
      'progressDates.Application': {
        $gte: new Date(`${yearQuery}-01-01`),
        $lte: new Date(`${yearQuery}-12-31`)
      }
    });

    for (const c of monthlyCandidates) {
      const d = c.progressDates?.Application;
      if (!d) continue;
      const key = dayjs(d).format('MMM');
      monthlyMap[key] = (monthlyMap[key] || 0) + 1;
    }

    const monthOrder = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthly = {
      labels: monthOrder,
      counts: monthOrder.map(m => monthlyMap[m] || 0)
    };

    // ✅ Response
    res.status(200).json({
      sources,
      decisions,
      pipeline,
      monthly
    });

  } catch (err) {
    console.error('❌ Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
};
