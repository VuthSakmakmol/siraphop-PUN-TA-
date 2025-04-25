const dayjs = require('dayjs');
const Roadmap = require('../models/Roadmap');
const Candidate = require('../models/Candidate');
const JobRequisition = require('../models/JobRequisition');

// 👇 Stage Mapping
const stageLabels = {
  Application: 'Received Application',
  ManagerReview: 'Sent to Manager',
  Interview: 'Interviews',
  JobOffer: 'Job Offer',
  Hired: 'Hired',
  Onboard: 'Onboard'
};

// 👇 Application Source Types
const sources = [
  '2.1 FIF',
  '2.2 Banner / Job Announcement Board',
  '2.3 Brochure',
  '2.4 Telegram',
  '2.5 Facebook',
  '2.6 Job Portal',
  '2.7 LinkedIn',
  '2.8 HR Call',
  '2.9 Other',
  '2.10 Agency'
];

// 👇 Get Month Name
const getMonthName = (i) =>
  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i];

// 👇 Main Report Handler
exports.getReport = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), type = 'White Collar', view = 'month' } = req.query;
    const columns = Array.from({ length: 12 }, (_, i) => getMonthName(i));

    // 📌 Roadmap Data
    const roadmapData = await Roadmap.find({ year, type });
    const roadmapMap = {};
    columns.forEach(month => {
      const entry = roadmapData.find(r => r.month === month);
      roadmapMap[month] = {
        roadmapHC: entry?.roadmapHC || 0,
        actualHC: entry?.actualHC || 0,
        hiringTargetHC: entry?.hiringTargetHC || 0
      };
    });

    // 📌 Candidates
    const candidates = await Candidate.find({}).populate('jobRequisitionId');
    const filtered = candidates.filter(c =>
      c.jobRequisitionId?.type === type &&
      dayjs(c.progressDates?.Application).year() === +year
    );

    // 📌 Recruitment Pipeline
    const pipelineStages = ['Application', 'ManagerReview', 'Interview', 'JobOffer', 'Hired', 'Onboard'];
    const pipeline = {};
    for (const stage of pipelineStages) pipeline[stage] = Array(12).fill(0);

    for (const c of filtered) {
      for (const stage of pipelineStages) {
        const d = c.progressDates?.[stage];
        if (d) {
          const m = dayjs(d).month();
          pipeline[stage][m]++;
        }
      }
    }

    // 📌 Source of Application
    const sourceCounts = {};
    for (const s of sources) sourceCounts[s] = Array(12).fill(0);
    const totalPerMonth = Array(12).fill(0);

    for (const c of filtered) {
      const m = dayjs(c.progressDates?.Application).month();
      const source = c.applicationSource;
      if (sources.includes(source)) {
        sourceCounts[source][m]++;
        totalPerMonth[m]++;
      }
    }

    const sourcePercent = {};
    for (const s of sources) {
      sourcePercent[s] = sourceCounts[s].map((val, i) =>
        totalPerMonth[i] > 0 ? `${Math.round((val / totalPerMonth[i]) * 100)}%` : '0%'
      );
    }

    // 📌 Vacancy Stats
    const stats = {
      averageDaysToHire: Array(12).fill(0),
      activeVacant: Array(12).fill(0),
      fillRate: Array(12).fill(0)
    };

    const hireDates = {};
    for (const c of filtered) {
      const applied = c.progressDates?.Application;
      const hired = c.progressDates?.Hired;
      if (applied && hired) {
        const m = dayjs(hired).month();
        const days = dayjs(hired).diff(dayjs(applied), 'day');
        hireDates[m] = hireDates[m] || [];
        hireDates[m].push(days);
      }
    }

    for (let i = 0; i < 12; i++) {
      const daysArr = hireDates[i] || [];
      if (daysArr.length) {
        stats.averageDaysToHire[i] = (daysArr.reduce((a, b) => a + b, 0) / daysArr.length).toFixed(2);
      }
      const monthName = columns[i];
      stats.activeVacant[i] = roadmapMap[monthName]?.roadmapHC - roadmapMap[monthName]?.actualHC;
      const target = roadmapMap[monthName]?.hiringTargetHC;
      const actual = pipeline.Hired[i] || 0;
      stats.fillRate[i] = target ? `${Math.round((actual / target) * 100)}%` : '0%';
    }

    // 📌 Build Output Rows
    const rows = [
      { label: '0. Job Requisition', values: [], isHeader: true },
      { label: 'Roadmap HC from planning', values: columns.map(m => roadmapMap[m]?.roadmapHC || 0) },
      { label: 'Actual HC ( end of month )', values: columns.map(m => roadmapMap[m]?.actualHC || 0) },
      { label: 'Actual HC ( end of month )', values: columns.map(m => roadmapMap[m]?.hiringTargetHC || 0) },

      { label: '1. Recruitment Pipeline', values: [], isHeader: true },
      { label: '1.1 Received Application', values: pipeline.Application },
      { label: '1.2 Sent to Manager', values: pipeline.ManagerReview },
      { label: '1.3 Interviews', values: pipeline.Interview },
      { label: '1.4 Job Offer', values: pipeline.JobOffer },
      { label: '1.5 Hired', values: pipeline.Hired },
      { label: '1.6 Onboard', values: pipeline.Onboard },

      { label: '2. Source of application', values: [], isHeader: true },
      ...sources.map(source => ({
        label: source,
        values: sourcePercent[source]
      })),

      { label: '3. Vacancies Statistic', values: [], isHeader: true },
      { label: '3.1 Average Day to Hire (Days)', values: stats.averageDaysToHire },
      { label: '3.2 Active Vacant (Position)', values: stats.activeVacant },
      { label: '3.3 Fill Rate (%)', values: stats.fillRate }
    ];

    res.json({ columns, rows });

  } catch (err) {
    console.error('❌ Report Error:', err);
    res.status(500).json({ message: 'Failed to load report' });
  }
};
