/**
 * AquaFarm Pro - Static Component Tests
 * Test coverage for static components
 */

import { render, screen } from '@testing-library/react'
import StaticComponent, { StaticCard, StaticHeader, StaticStats } from '../StaticComponent'
import { Activity, Fish, Droplets } from 'lucide-react'

describe('StaticComponent', () => {
  it('should render children correctly', () => {
    render(
      <StaticComponent>
        <div>Test Content</div>
      </StaticComponent>
    )
    
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(
      <StaticComponent className="custom-class">
        <div>Test Content</div>
      </StaticComponent>
    )
    
    const element = screen.getByText('Test Content').parentElement
    expect(element).toHaveClass('custom-class')
  })

  it('should render as custom element', () => {
    render(
      <StaticComponent as="section">
        <div>Test Content</div>
      </StaticComponent>
    )
    
    const element = screen.getByText('Test Content').parentElement
    expect(element?.tagName).toBe('SECTION')
  })
})

describe('StaticCard', () => {
  it('should render card with children', () => {
    render(
      <StaticCard>
        <div>Card Content</div>
      </StaticCard>
    )
    
    expect(screen.getByText('Card Content')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(
      <StaticCard className="custom-card">
        <div>Card Content</div>
      </StaticCard>
    )
    
    const element = screen.getByText('Card Content').parentElement
    expect(element).toHaveClass('custom-card')
  })
})

describe('StaticHeader', () => {
  it('should render title correctly', () => {
    render(<StaticHeader title="Test Title" />)
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('should render subtitle when provided', () => {
    render(
      <StaticHeader 
        title="Test Title" 
        subtitle="Test Subtitle" 
      />
    )
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument()
  })

  it('should not render subtitle when not provided', () => {
    render(<StaticHeader title="Test Title" />)
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.queryByText('Test Subtitle')).not.toBeInTheDocument()
  })
})

describe('StaticStats', () => {
  const mockStats = [
    { label: 'Farms', value: '5', icon: Activity },
    { label: 'Ponds', value: '12', icon: Fish },
    { label: 'Water Quality', value: 'Good', icon: Droplets },
  ]

  it('should render stats correctly', () => {
    render(<StaticStats stats={mockStats} />)
    
    expect(screen.getByText('Farms')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Ponds')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Water Quality')).toBeInTheDocument()
    expect(screen.getByText('Good')).toBeInTheDocument()
  })

  it('should render icons when provided', () => {
    render(<StaticStats stats={mockStats} />)
    
    // Icons should be rendered (they're SVG elements)
    const icons = screen.getAllByRole('img', { hidden: true })
    expect(icons).toHaveLength(3)
  })

  it('should apply custom className', () => {
    render(<StaticStats stats={mockStats} className="custom-stats" />)
    
    const container = screen.getByText('Farms').closest('.grid')
    expect(container).toHaveClass('custom-stats')
  })

  it('should handle empty stats array', () => {
    render(<StaticStats stats={[]} />)
    
    // Should render without errors
    expect(screen.getByRole('generic')).toBeInTheDocument()
  })
})
