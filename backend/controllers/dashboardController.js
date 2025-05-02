const Candidate = require('../models/Candidate')

// 📊 POST /api/dashboard/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const { type, subType } = req.body

    // 🔍 Build candidate filter
    const filter = {}
    if (type) filter.type = type
    if (subType) filter.subType = subType

    // 🧑‍💼 Get candidates by type + subtype
    const candidates = await Candidate.find(filter)
    console.log('👥 Matched Candidates:', candidates.length)

    // ─────────────────────────────────────────────────────────────
    // 🟠 1. Source Breakdown (applicationSource)
    // ─────────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────
    // 🟢 2. Final Decision Breakdown (hireDecision)
    // ─────────────────────────────────────────────────────────────
    const decisionMap = {
      Hired: 0,
      'Not Hired': 0,
      'Candidate Refused': 0,
      'Candidate in Process': 0 // default if undefined
    }

    for (const c of candidates) {
      const decision = (c.hireDecision || 'Candidate in Process').trim()
      decisionMap[decision] = (decisionMap[decision] || 0) + 1
    }

    const decisions = {
      labels: Object.keys(decisionMap),
      counts: Object.values(decisionMap)
    }

    // ✅ Log and respond
    console.log('📊 Sources:', sources)
    console.log('📊 Decisions:', decisions)

    res.status(200).json({ sources, decisions })

  } catch (err) {
    console.error('❌ Dashboard stats error:', err)
    res.status(500).json({ error: 'Failed to load dashboard stats' })
  }
}
