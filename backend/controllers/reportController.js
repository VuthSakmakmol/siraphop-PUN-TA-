const dayjs = require('dayjs');
const Roadmap = require('../models/Roadmap');
const Candidate = require('../models/Candidate');

// Clean Source Names
const sources = [
  'FIF',
  'Banner / Job Announcement Board',
  'Brochure',
  'Telegram',
  'Facebook',
  'Job Portal',
  'LinkedIn',
  'HR Call',
  'Other',
  'Agency'
];

const stageLabels = {
  Application: 'Received Application',
  ManagerReview: 'Sent to Manager',
  Interview: 'Interviews',
  JobOffer: 'Job Offer',
  Hired: 'Hired',
  Onboard: 'Onboard'
};

const getMonthName = (i) =>
  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i];

exports.getReport = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), type = 'White Collar', view = 'month', quarter = null, month = null } =
      req.method === 'POST' ? req.body : req.query;

    const months = Array.from({ length: 12 }, (_, i) => getMonthName(i));

    let columns = months;
    if (view === 'quarter') columns = ['Q1', 'Q2', 'Q3', 'Q4'];
    if (view === 'year') columns = [String(year)];

    // Fetch Roadmap
    const roadmapData = await Roadmap.find({ year, type });
    const roadmapMap = {};
    months.forEach(month => {
      const r = roadmapData.find(x => x.month === month);
      roadmapMap[month] = {
        roadmapHC: r?.roadmapHC || 0,
        actualHC: r?.actualHC || 0,
        hiringTargetHC: r?.hiringTargetHC || 0
      };
    });

    // Fetch Candidates
    const allCandidates = await Candidate.find({}).populate('jobRequisitionId');

    const filtered = allCandidates.filter(c => {
      if (!c.progressDates?.Application) return false;

      const applicationDate = dayjs(c.progressDates.Application);
      const applicationYear = applicationDate.year();
      const applicationMonth = applicationDate.month();
      const applicationQuarter = Math.floor(applicationMonth / 3) + 1;

      const matchesYear = applicationYear === +year;
      const matchesType = !type || (c.jobRequisitionId && c.jobRequisitionId.type === type);

      if (!matchesYear || !matchesType) return false;

      if (view === 'quarter' && quarter) {
        return applicationQuarter === +quarter;
      }
      if (view === 'month' && month) {
        return applicationMonth === +month;
      }

      return true;
    });

    // Prepare blank arrays
    const initialArray = () => {
      if (view === 'year') return [0];
      if (view === 'quarter') return Array(4).fill(0);
      return Array(12).fill(0);
    };

    // Recruitment Pipeline
    const pipelineStages = ['Application', 'ManagerReview', 'Interview', 'JobOffer', 'Hired', 'Onboard'];
    const pipeline = {};
    for (const stage of pipelineStages) pipeline[stage] = initialArray();

    for (const c of filtered) {
      for (const stage of pipelineStages) {
        const d = c.progressDates?.[stage];
        if (d) {
          const m = dayjs(d).month();
          const idx = getIndex(view, m);
          pipeline[stage][idx]++;
        }
      }
    }

    // Source of Application
    const sourceCounts = {};
    for (const s of sources) sourceCounts[s] = initialArray();
    const totalPerPeriod = initialArray();

    for (const c of filtered) {
      const m = dayjs(c.progressDates?.Application).month();
      const rawSource = c.applicationSource?.trim();
      if (!rawSource) continue;

      for (const definedSource of sources) {
        if (rawSource.toLowerCase().includes(definedSource.toLowerCase())) {
          const idx = getIndex(view, m);
          sourceCounts[definedSource][idx]++;
          totalPerPeriod[idx]++;
          break;
        }
      }
    }

    const sourcePercent = {};
    for (const s of sources) {
      sourcePercent[s] = sourceCounts[s].map((val, i) =>
        totalPerPeriod[i] > 0 ? `${Math.round((val / totalPerPeriod[i]) * 100)}%` : '0%'
      );
    }

    // Vacancy Stats
    const stats = {
      averageDaysToHire: initialArray(),
      activeVacant: initialArray(),
      fillRate: initialArray()
    };

    const hireDates = {};
    for (const c of filtered) {
      const applied = c.progressDates?.Application;
      const hired = c.progressDates?.Hired;
      if (applied && hired) {
        const m = dayjs(hired).month();
        const idx = getIndex(view, m);
        hireDates[idx] = hireDates[idx] || [];
        const days = dayjs(hired).diff(dayjs(applied), 'day');
        hireDates[idx].push(days);
      }
    }

    for (let i = 0; i < stats.averageDaysToHire.length; i++) {
      const daysArr = hireDates[i] || [];
      if (daysArr.length) {
        stats.averageDaysToHire[i] = (daysArr.reduce((a, b) => a + b, 0) / daysArr.length).toFixed(2);
      }
      if (view === 'year') {
        const totalRoadmap = months.reduce((sum, m) => sum + (roadmapMap[m]?.roadmapHC || 0), 0);
        const totalActual = months.reduce((sum, m) => sum + (roadmapMap[m]?.actualHC || 0), 0);
        const totalTarget = months.reduce((sum, m) => sum + (roadmapMap[m]?.hiringTargetHC || 0), 0);
        stats.activeVacant[i] = totalRoadmap - totalActual;
        stats.fillRate[i] = totalTarget > 0
          ? `${Math.round((pipeline.Hired[i] / totalTarget) * 100)}%`
          : '0%';
      } else if (view === 'quarter') {
        const qMonths = getQuarterMonths(i);
        const roadmapSum = qMonths.reduce((sum, m) => sum + (roadmapMap[getMonthName(m)]?.roadmapHC || 0), 0);
        const actualSum = qMonths.reduce((sum, m) => sum + (roadmapMap[getMonthName(m)]?.actualHC || 0), 0);
        const targetSum = qMonths.reduce((sum, m) => sum + (roadmapMap[getMonthName(m)]?.hiringTargetHC || 0), 0);
        stats.activeVacant[i] = roadmapSum - actualSum;
        stats.fillRate[i] = targetSum > 0
          ? `${Math.round((pipeline.Hired[i] / targetSum) * 100)}%`
          : '0%';
      } else {
        const monthName = months[i];
        stats.activeVacant[i] = roadmapMap[monthName]?.roadmapHC - roadmapMap[monthName]?.actualHC;
        const target = roadmapMap[monthName]?.hiringTargetHC;
        stats.fillRate[i] = target > 0
          ? `${Math.round((pipeline.Hired[i] / target) * 100)}%`
          : '0%';
      }
    }

    // Build Rows
    const rows = [
      { label: '0. Job Requisition', values: [], isHeader: true },
      { label: 'Roadmap HC from planning', values: getCombinedRoadmap('roadmapHC', view, months, roadmapMap) },
      { label: 'Actual HC (end of month)', values: getCombinedRoadmap('actualHC', view, months, roadmapMap) },
      { label: 'Hiring Target HC', values: getCombinedRoadmap('hiringTargetHC', view, months, roadmapMap) },

      { label: '1. Recruitment Pipeline', values: [], isHeader: true },
      { label: '1.1 Received Application', values: pipeline.Application },
      { label: '1.2 Sent to Manager', values: pipeline.ManagerReview },
      { label: '1.3 Interviews', values: pipeline.Interview },
      { label: '1.4 Job Offer', values: pipeline.JobOffer },
      { label: '1.5 Hired', values: pipeline.Hired },
      { label: '1.6 Onboard', values: pipeline.Onboard },

      { label: '2. Source of Application', values: [], isHeader: true },
      ...sources.map(source => ({
        label: source,
        values: sourceCounts[source],
        percents: sourcePercent[source],
        isSource: true
      })),

      { label: '3. Vacancies Statistic', values: [], isHeader: true },
      { label: '3.1 Average Day to Hire (Days)', values: stats.averageDaysToHire },
      { label: '3.2 Active Vacant (Position)', values: stats.activeVacant },
      { label: '3.3 Fill Rate (%)', values: stats.fillRate }
    ];

    res.json({ columns, rows });

  } catch (err) {
    console.error('❌ Report Error:', err);
    res.status(500).json({ message: 'Failed to load report', error: err.message });
  }
};

// 🔥 Helpers
function getIndex(view, month) {
  if (view === 'year') return 0;
  if (view === 'quarter') return Math.floor(month / 3);
  return month;
}

function getQuarterMonths(qIndex) {
  return [qIndex * 3, qIndex * 3 + 1, qIndex * 3 + 2];
}

function getCombinedRoadmap(key, view, months, roadmapMap) {
  if (view === 'year') {
    return [
      months.reduce((sum, m) => sum + (roadmapMap[m]?.[key] || 0), 0)
    ];
  } else if (view === 'quarter') {
    return [0, 1, 2, 3].map(q =>
      getQuarterMonths(q).reduce((sum, m) => sum + (roadmapMap[getMonthName(m)]?.[key] || 0), 0)
    );
  } else {
    return months.map(m => roadmapMap[m]?.[key] || 0);
  }
}
