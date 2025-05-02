const Candidate = require('../models/Candidate')

// 📊 POST /api/dashboard/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const { type, subType } = req.body

    // 🔍 Build filter based on type/subType
    const filter = {}
    if (type) filter.type = type
    if (subType) filter.subType = subType

    // 👥 Get filtered candidates
    const candidates = await Candidate.find(filter)
    console.log('👥 Matched Candidates:', candidates.length)

    // ──────────────────────────────────────────────
    // 🟠 1. Application Source Breakdown
    // ──────────────────────────────────────────────
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

    // ──────────────────────────────────────────────
    // 🟢 2. Final Decision Breakdown
    // ──────────────────────────────────────────────
    const decisionMap = {
      Hired: 0,
      'Not Hired': 0,
      'Candidate Refused': 0,
      'Candidate in Process': 0
    }

    for (const c of candidates) {
      const decision = (c.hireDecision || 'Candidate in Process').trim()
      decisionMap[decision] = (decisionMap[decision] || 0) + 1
    }

    const decisions = {
      labels: Object.keys(decisionMap),
      counts: Object.values(decisionMap)
    }

    // ──────────────────────────────────────────────
    // 🔵 3. Recruitment Pipeline from progressDates
    // ──────────────────────────────────────────────
    const pipeline = {
      Application: 0,
      ManagerReview: 0,
      Interview: 0,
      JobOffer: 0,
      Hired: 0,
      Onboard: 0
    }

    for (const c of candidates) {
      const p = c.progressDates || {}  // ✅ Use progressDates

      if (p.Application) pipeline.Application++
      if (p.ManagerReview) pipeline.ManagerReview++
      if (p.Interview) pipeline.Interview++
      if (p.JobOffer) pipeline.JobOffer++
      if (p.Hired) pipeline.Hired++
      if (p.Onboard) pipeline.Onboard++
    }

    // ✅ Final Response
    res.status(200).json({
      sources,
      decisions,
      pipeline
    })

  } catch (err) {
    console.error('❌ Dashboard stats error:', err)
    res.status(500).json({ error: 'Failed to load dashboard stats' })
  }
}
