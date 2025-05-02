const Candidate = require('../models/Candidate')
const dayjs = require('dayjs')

// 📊 POST /api/dashboard/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const { type, subType, year } = req.body

    // ─────────────────────────────────────────────
    // 🔍 Filter for other charts (source, decision, pipeline)
    const filter = {}
    if (type) filter.type = type
    if (subType) filter.subType = subType

    const candidates = await Candidate.find(filter)

    // ─────────────────────────────────────────────
    // 🟠 Source Breakdown
    const sourceMap = {}
    for (const c of candidates) {
      const source = (c.applicationSource || '').trim()
      if (!source) continue
      sourceMap[source] = (sourceMap[source] || 0) + 1
    }
    const sources = {
      labels: Object.keys(sourceMap),
      counts: Object.values(sourceMap)
    }

    // ─────────────────────────────────────────────
    // 🟢 Final Decision Breakdown
    const decisionMap = {
      Hired: 0,
      'Not Hired': 0,
      'Candidate Refused': 0,
      'Candidate in Process': 0
    }
    for (const c of candidates) {
      const d = (c.hireDecision || 'Candidate in Process').trim()
      decisionMap[d] = (decisionMap[d] || 0) + 1
    }
    const decisions = {
      labels: Object.keys(decisionMap),
      counts: Object.values(decisionMap)
    }

    // ─────────────────────────────────────────────
    // 🔵 Recruitment Pipeline
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

    // ─────────────────────────────────────────────
    // 📆 Monthly Applications for selected year only
    const monthlyMap = {}
    const allCandidates = await Candidate.find({
      'progressDates.Application': {
        ...(year && {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        })
      }
    })

    for (const c of allCandidates) {
      const d = c.progressDates?.Application
      if (!d) continue

      const key = dayjs(d).format('MMM') // "Jan", "Feb", etc.
      monthlyMap[key] = (monthlyMap[key] || 0) + 1
    }

    // Always return all 12 months (fill missing with 0)
    const monthOrder = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const labels = []
    const counts = []

    for (const m of monthOrder) {
      labels.push(m)
      counts.push(monthlyMap[m] || 0)
    }

    const monthly = { labels, counts }

    // ─────────────────────────────────────────────
    // ✅ Final Response
    res.status(200).json({
      sources,
      decisions,
      pipeline,
      monthly
    })

  } catch (err) {
    console.error('❌ Dashboard stats error:', err)
    res.status(500).json({ error: 'Failed to load dashboard stats' })
  }
}
