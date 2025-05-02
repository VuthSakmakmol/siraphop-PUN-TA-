const Candidate = require('../models/Candidate')

// POST /api/dashboard/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const { type, subType } = req.body

    const filter = {}
    if (type) filter.type = type
    if (subType) filter.subType = subType

    const candidates = await Candidate.find(filter)
    console.log('👥 Matched Candidates:', candidates.length)

    const sourceMap = {}

    for (const c of candidates) {
      const source = (c.applicationSource || '').trim()  // ✅ Fixed here
      if (!source) continue

      sourceMap[source] = (sourceMap[source] || 0) + 1
    }

    const sources = {
      labels: Object.keys(sourceMap),
      counts: Object.values(sourceMap)
    }

    console.log('📊 Final Sources:', sources)
    res.status(200).json({ sources })
  } catch (err) {
    console.error('❌ Dashboard error:', err)
    res.status(500).json({ error: 'Failed to load dashboard stats' })
  }
}
