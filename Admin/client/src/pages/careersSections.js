/** URL segment → sidebar label & page heading (careers pipeline). */
export const CAREER_SECTIONS = {
  applied: {
    title: 'Applied',
    // description: 'Applications received and awaiting initial review.',
  },
  'my-applicants': {
    title: 'My Applicants',
    description: 'Applicants you have tagged from the Applied list.',
  },
  shortlisted: {
    title: 'Shortlisted',
    description: 'Candidates moved forward in the hiring funnel.',
  },
  'under-review': {
    title: 'Under Review',
    description: 'Applications currently being evaluated by the team.',
  },
  selected: {
    title: 'Selected',
    description: 'Candidates selected for the next stage or offer.',
  },
  archived: {
    title: 'Archived',
    description: 'Closed or withdrawn applications kept for reference.',
  },
  'hr-applicants': {
    title: 'HR Candidates',
    description: 'Tagged applicants across HRs — filter by HR and use Re-tag to release a claim.',
  },
}

export function isCareerSection(segment) {
  return segment != null && segment !== '' && segment in CAREER_SECTIONS
}
