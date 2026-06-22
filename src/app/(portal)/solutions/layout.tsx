import SolutionsTabs from './SolutionsTabs'

export default function SolutionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <SolutionsTabs />
      {children}
    </div>
  )
}
