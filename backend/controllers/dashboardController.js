const Candidate = require('../models/Candidate')
const JobRequisition = require('../models/JobRequisition')
const dayjs = require('dayjs')

exports.getDashboardStats = async (req, res) => {
  try {
    const { type, subType, from, to, recruiter, departmentId, year } = req.body

    const filter = {}
    const jobFilter = {}

    if (type) {
      filter.type = type
      jobFilter.type = type
    }

    // ✅ Apply subType only for Blue Collar
    if (type === 'Blue Collar' && subType) {
      filter.subType = subType
      jobFilter.subType = subType
    }

    if (recruiter) filter.recruiter = recruiter

    if (from || to) {
      filter['progressDates.Application'] = {}
      if (from) filter['progressDates.Application'].$gte = new Date(from)
      if (to) filter['progressDates.Application'].$lte = new Date(to)
    }

    if (departmentId) {
      const jobs = await JobRequisition.find({ departmentId }).select('_id')
      const jobIds = jobs.map(j => j._id)
      filter.jobRequisitionId = { $in: jobIds }
      jobFilter.departmentId = departmentId
    }

    const candidates = await Candidate.find(filter)

    // 📊 Source Breakdown
    const sourceMap = {}
    for (const c of candidates) {
      const source = (c.applicationSource || '').trim()
      if (source) sourceMap[source] = (sourceMap[source] || 0) + 1
    }
    const sources = {
      labels: Object.keys(sourceMap),
      counts: Object.values(sourceMap)
    }

    // 📊 Final Decisions
    const decisionMap = {
      Hired: 0,
      'Not Hired': 0,
      'Candidate Refused': 0,
      'Candidate in Process': 0
    }
    for (const c of candidates) {
      const decision = c.hireDecision || 'Candidate in Process'
      decisionMap[decision] = (decisionMap[decision] || 0) + 1
    }
    const decisions = {
      labels: Object.keys(decisionMap),
      counts: Object.values(decisionMap)
    }

    // 📊 Pipeline
    const pipeline = {
      Application: 0,
      ManagerReview: 0,
      Interview: 0,
      JobOffer: 0,
      Hired: 0,
      Onboard: 0
    }
    for (const c of candidates) {
      const p = c.progressDates || {}
      if (p.Application) pipeline.Application++
      if (p.ManagerReview) pipeline.ManagerReview++
      if (p.Interview) pipeline.Interview++
      if (p.JobOffer) pipeline.JobOffer++
      if (p.Hired) pipeline.Hired++
      if (p.Onboard) pipeline.Onboard++
    }

    // 📈 Monthly
    const selectedYear = year || new Date().getFullYear()
    const monthlyMap = {}

    const monthlyCandidates = await Candidate.find({
      'progressDates.Application': {
        $gte: new Date(`${selectedYear}-01-01`),
        $lte: new Date(`${selectedYear}-12-31`)
      },
      ...(type && { type }),
      ...(type === 'Blue Collar' && subType ? { subType } : {})
    })

    for (const c of monthlyCandidates) {
      const d = c.progressDates?.Application
      if (!d) continue
      const key = dayjs(d).format('MMM')
      monthlyMap[key] = (monthlyMap[key] || 0) + 1
    }

    const monthOrder = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const monthly = {
      labels: monthOrder,
      counts: monthOrder.map(m => monthlyMap[m] || 0)
    }

    // 📊 KPI Metrics
    const totalRequisitions = await JobRequisition.countDocuments(jobFilter)

    const filled = await Candidate.countDocuments({
      ...filter,
      progress: 'Onboard',
      hireDecision: 'Hired'
    })

    const hiringCostAgg = await JobRequisition.aggregate([
      { $match: jobFilter },
      { $group: { _id: null, total: { $sum: '$hiringCost' } } }
    ])
    const hiringCost = hiringCostAgg[0]?.total || 0
    const costPerHire = filled > 0 ? (hiringCost / filled).toFixed(2) : 0

    const hiredCandidates = await Candidate.find({
      ...filter,
      progress: 'Onboard',
      hireDecision: 'Hired',
      'progressDates.Application': { $exists: true },
      'progressDates.Onboard': { $exists: true }
    })

    let totalDays = 0
    for (const c of hiredCandidates) {
      const start = new Date(c.progressDates.Application)
      const end = new Date(c.progressDates.Onboard)
      totalDays += (end - start) / (1000 * 60 * 60 * 24)
    }

    const averageDaysToHire = hiredCandidates.length > 0
      ? (totalDays / hiredCandidates.length).toFixed(1)
      : 0

    const activeVacancies = await JobRequisition.countDocuments({
      ...jobFilter,
      status: 'Vacant'
    })

    const fillRate = totalRequisitions > 0
      ? ((filled / totalRequisitions) * 100).toFixed(1)
      : 0

    res.status(200).json({
      sources,
      decisions,
      pipeline,
      monthly,
      kpi: {
        totalRequisitions,
        filled,
        hiringCost,
        costPerHire,
        averageDaysToHire,
        activeVacancies,
        fillRate
      }
    })
  } catch (err) {
    console.error('❌ Dashboard stats error:', err)
    res.status(500).json({ error: 'Failed to load dashboard stats' })
  }
}
