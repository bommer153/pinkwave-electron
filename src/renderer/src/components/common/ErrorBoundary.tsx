import { Component, type ReactNode } from 'react'
import { Button } from '@heroui/react'
import { TriangleAlert } from 'lucide-react'
import { EmptyState } from './EmptyState'

interface Props {
  children: ReactNode
  onGoHome(): void
}

/** Contains a crashing page so the sidebar and player (and the music) keep working. */
export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('Page crashed:', error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <EmptyState
        icon={TriangleAlert}
        title="This page ran into a problem"
        message={this.state.error.message || 'Something unexpected happened.'}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onPress={() => this.setState({ error: null })}>
              Try again
            </Button>
            <Button size="sm" onPress={this.props.onGoHome}>
              Go home
            </Button>
          </div>
        }
      />
    )
  }
}
