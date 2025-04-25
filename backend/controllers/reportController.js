const Candidate = require('../models/Candidate')
const JobRequisition = require('../models/JobRequisition')
const Department = require('../models/Department')

// Month Mapping
const getMonthName = (index) =>
  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]

exports.getMonthlyPerformance = async (req, res) => {
  try {
    const { year, category = 'White Collar', recruiter } = req.query
    const yearNum = parseInt(year)

    // Determine type/subType
    let type = 'White Collar'
    let subType = null
    if (category === 'Blue Collar - Sewer') {
      type = 'Blue Collar'
      subType = 'Sewer'
    } else if (category === 'Blue Collar - Non-Sewer') {
      type = 'Blue Collar'
      subType = 'Non-Sewer'
    }

    const candidates = await Candidate.find({ type })
      .populate({
        path: 'jobRequisitionId',
        populate: { path: 'departmentId' }
      })

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: getMonthName(i),
      application: 0,
      interview: 0,
      jobOffer: 0,
      hired: 0,
      recruiter: '',
      sources: {} // Optional if you want source breakdown
    }))

    for (const c of candidates) {
      const createdAt = new Date(c.createdAt)
      const m = createdAt.getMonth()
      const y = createdAt.getFullYear()

      if (yearNum && y !== yearNum) continue
      if (subType && c.jobRequisitionId?.subType !== subType) continue
      if (recruiter && c.recruiter !== recruiter) continue

      const row = monthlyData[m]
      row.application += c.progressDates?.Application ? 1 : 0
      row.interview += c.progressDates?.Interview ? 1 : 0
      row.jobOffer += c.progressDates?.JobOffer ? 1 : 0
      row.hired += c.progressDates?.Hired ? 1 : 0
      row.recruiter = c.recruiter || ''
      const source = c.applicationSource || 'Other'
      row.sources[source] = (row.sources[source] || 0) + 1
    }

    res.json({ data: monthlyData })

  } catch (err) {
    console.error('❌ getMonthlyPerformance error:', err)
    res.status(500).json({ message: 'Failed to generate monthly report' })
  }
}

