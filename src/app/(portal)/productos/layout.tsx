import ProductosTabs from './ProductosTabs'

export default function ProductosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <ProductosTabs />
      {children}
    </div>
  )
}
