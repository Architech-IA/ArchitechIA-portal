import { NextResponse } from 'next/server'

const TOKEN    = process.env.GITHUB_TOKEN    || ''
const USERNAME = process.env.GITHUB_USERNAME || 'Architech-IA'

export async function GET() {
  try {
    const headers: Record<string, string> = { 'Accept': 'application/vnd.github+json' }
    if (TOKEN) headers['Authorization'] = 'Bearer ' + TOKEN

    const res = await fetch(
      'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member',
      { headers, next: { revalidate: 60 } }
    )
    if (!res.ok) return NextResponse.json({ error: 'GitHub API error ' + res.status }, { status: 502 })

    const repos = await res.json()

    const enriched = await Promise.all(
      repos.map(async (r: Record<string, unknown>) => {
        try {
          const branch = (r.default_branch as string) || 'main'
          const fullName = r.full_name as string

          const [cr, wr] = await Promise.all([
            fetch(`https://api.github.com/repos/${fullName}/commits/${branch}`, { headers, next: { revalidate: 60 } }),
            fetch(`https://api.github.com/repos/${fullName}/actions/runs?per_page=1`, { headers, next: { revalidate: 60 } }),
          ])

          const commit = cr.ok ? await cr.json() : null
          const workflows = wr.ok ? await wr.json() : null
          const lastRun = workflows?.workflow_runs?.[0] ?? null

          return {
            id:             r.id,
            name:           r.name,
            full_name:      r.full_name,
            description:    r.description,
            private:        r.private,
            language:       r.language,
            url:            r.html_url,
            default_branch: r.default_branch,
            updated_at:     r.updated_at,
            pushed_at:      r.pushed_at,
            stars:          r.stargazers_count,
            forks:          r.forks_count,
            open_issues:    r.open_issues_count,
            last_commit: commit ? {
              sha:     (commit.sha as string)?.slice(0, 7),
              message: (commit.commit?.message as string)?.split('\n')[0],
              author:  commit.commit?.author?.name,
              date:    commit.commit?.author?.date,
            } : null,
            last_workflow: lastRun ? {
              name:       lastRun.name,
              status:     lastRun.status,
              conclusion: lastRun.conclusion,
              updated_at: lastRun.updated_at,
              url:        lastRun.html_url,
            } : null,
          }
        } catch {
          return { ...r, last_commit: null, last_workflow: null }
        }
      })
    )

    return NextResponse.json({ repos: enriched, username: USERNAME })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
