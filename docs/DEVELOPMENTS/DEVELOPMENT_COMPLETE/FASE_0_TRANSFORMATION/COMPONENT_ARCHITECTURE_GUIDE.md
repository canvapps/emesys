# 🏗️ Component Architecture Guide - Event Management Engine

**Date:** 2025-01-13  
**Version:** 1.0.0  
**Target Audience:** Frontend Developers  

---

## 📋 **OVERVIEW**

Guide ini menjelaskan arsitektur komponen generic Event Management Engine platform, termasuk design patterns, best practices, dan cara extend components untuk event types baru.

---

## 🎯 **CORE ARCHITECTURE PRINCIPLES**

### **1. Plugin-Based Component System**
```typescript
// Pattern: Event-agnostic dengan plugin support
interface EventComponentProps {
  eventId: string;
  eventType: string;
  config: EventPluginConfig;
}

export const EventHero: React.FC<EventComponentProps> = ({ 
  eventId, 
  eventType, 
  config 
}) => {
  const { eventData, isLoading } = useEventContent(eventId);
  const plugin = useEventPlugin(eventType);
  
  return plugin.renderHero(eventData, config);
};
```

### **2. Separation of Concerns**
```
Generic Components    →  Plugin-Specific Components
     │                           │
     ├─ EventHero               ├─ WeddingHero
     ├─ EventDetails            ├─ ConferenceAgenda  
     ├─ ParticipantsSection     ├─ SpeakersList
     └─ RegistrationSection     └─ AttendeeForm
```

### **3. Composition Over Inheritance**
```typescript
// ✅ Good: Composable components
const WeddingEvent = () => (
  <EventLayout>
    <EventHero plugin="wedding" />
    <ParticipantsSection plugin="wedding" />
    <EventDetails plugin="wedding" />
  </EventLayout>
);

// ❌ Bad: Inheritance-based
class WeddingEvent extends EventComponent { /* ... */ }
```

---

## 🏛️ **COMPONENT HIERARCHY**

### **Top-Level Architecture**

```
App.tsx
├── EventManagementEngine
    ├── EventRouter
    │   ├── PublicEventView
    │   │   ├── EventLayout
    │   │   │   ├── EventHero          (Generic)
    │   │   │   ├── EventDetails       (Generic)
    │   │   │   ├── ParticipantsSection (Generic)
    │   │   │   ├── EventSections      (Generic)
    │   │   │   └── RegistrationSection (Generic)
    │   │   └── PluginComponents       (Plugin-specific)
    │   └── AdminEventView
    │       ├── AdminLayout
    │       ├── EventFormWithPlugin
    │       └── EventPreview
    └── PluginSystem
        ├── PluginRegistry
        ├── PluginLoader
        └── PluginHooks
```

---

## 🧱 **GENERIC COMPONENTS**

### **1. EventHero Component**

**Purpose:** Display event hero section dengan plugin support
**Location:** `src/components/EventHero.tsx`

```typescript
import React from 'react';
import { useEventPlugin } from '@/plugins/hooks';
import { useEventContent } from '@/hooks/useEventContent';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface EventHeroProps {
  eventId: string;
  eventType: string;
  config?: any;
  className?: string;
}

export const EventHero: React.FC<EventHeroProps> = ({ 
  eventId, 
  eventType, 
  config = {},
  className = "" 
}) => {
  const { eventData, isLoading, error } = useEventContent(eventId);
  const plugin = useEventPlugin(eventType);

  // Loading state
  if (isLoading) {
    return (
      <div className={`${className}`}>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="p-6">
          <p className="text-red-600">Failed to load event data</p>
        </CardContent>
      </Card>
    );
  }

  // No plugin found
  if (!plugin) {
    return (
      <Card className={`border-yellow-200 ${className}`}>
        <CardContent className="p-6">
          <p className="text-yellow-600">
            Plugin not found for event type: {eventType}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Render using plugin
  return (
    <div className={className}>
      {plugin.renderHero(eventData, config)}
    </div>
  );
};

// Default export with error boundary
export default EventHero;
```

### **2. ParticipantsSection Component**

```typescript
import React from 'react';
import { useEventPlugin } from '@/plugins/hooks';
import { useEventParticipants } from '@/hooks/useEventParticipants';

interface ParticipantsSectionProps {
  eventId: string;
  eventType: string;
  showTitle?: boolean;
  config?: any;
}

export const ParticipantsSection: React.FC<ParticipantsSectionProps> = ({ 
  eventId, 
  eventType, 
  showTitle = true,
  config = {}
}) => {
  const { participants, isLoading } = useEventParticipants(eventId);
  const plugin = useEventPlugin(eventType);

  if (isLoading) {
    return <div>Loading participants...</div>;
  }

  if (!plugin) {
    return <div>Plugin not available</div>;
  }

  return (
    <section className="py-8">
      {showTitle && (
        <div className="container mx-auto px-4 mb-8">
          <h2 className="text-3xl font-bold text-center">
            {plugin.getParticipantsTitle?.() || 'Participants'}
          </h2>
        </div>
      )}
      
      {plugin.renderParticipants(participants, config)}
    </section>
  );
};
```

---

## 🔧 **PLUGIN COMPONENT INTEGRATION**

### **Plugin Interface untuk Components**

```typescript
// src/plugins/types.ts
export interface EventPlugin {
  // Component renderers
  renderHero(data: EventData, config: any): React.ReactNode;
  renderParticipants(data: ParticipantData[], config: any): React.ReactNode;
  renderDetails(data: EventData, config: any): React.ReactNode;
  renderRegistration(data: EventData, config: any): React.ReactNode;
  
  // Optional component customizations
  getParticipantsTitle?(): string;
  getDetailsTitle?(): string;
  getRegistrationTitle?(): string;
  
  // Layout customizations
  getHeroHeight?(): string;
  getSectionSpacing?(): string;
  getColorScheme?(): ColorScheme;
}
```

### **Wedding Plugin Component Example**

```typescript
// src/plugins/wedding/components/WeddingHero.tsx
import React from 'react';
import { WeddingData } from '../types';

interface WeddingHeroProps extends WeddingData {
  config: {
    showCountdown?: boolean;
    backgroundImage?: string;
    textColor?: string;
  };
}

export const WeddingHero: React.FC<WeddingHeroProps> = ({
  groomName,
  brideName,
  weddingDate,
  venue,
  config
}) => {
  return (
    <div 
      className="relative min-h-[600px] flex items-center justify-center"
      style={{ 
        backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : undefined,
        color: config.textColor || 'white'
      }}
    >
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">
          {brideName} & {groomName}
        </h1>
        <p className="text-2xl mb-6">{weddingDate}</p>
        <p className="text-xl">{venue}</p>
        
        {config.showCountdown && (
          <CountdownTimer targetDate={weddingDate} />
        )}
      </div>
    </div>
  );
};
```

---

## 🎨 **STYLING & THEMING**

### **1. Consistent Design System**

```typescript
// src/lib/design-tokens.ts
export const designTokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      500: '#3b82f6',
      900: '#1e3a8a'
    },
    event: {
      wedding: '#ec4899',     // Pink
      conference: '#3b82f6',  // Blue
      birthday: '#f59e0b',    // Amber
      seminar: '#10b981'      // Emerald
    }
  },
  typography: {
    hero: 'text-4xl md:text-6xl font-bold',
    section: 'text-2xl md:text-3xl font-semibold',
    body: 'text-base md:text-lg'
  },
  spacing: {
    section: 'py-12 md:py-16',
    container: 'container mx-auto px-4'
  }
};
```

### **2. Theme Provider System**

```typescript
// src/context/EventThemeContext.tsx
import React, { createContext, useContext } from 'react';

interface EventTheme {
  eventType: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  typography: {
    fontFamily: string;
    sizes: Record<string, string>;
  };
  layout: {
    maxWidth: string;
    spacing: Record<string, string>;
  };
}

const EventThemeContext = createContext<EventTheme | null>(null);

export const useEventTheme = () => {
  const theme = useContext(EventThemeContext);
  if (!theme) {
    throw new Error('useEventTheme must be used within EventThemeProvider');
  }
  return theme;
};
```

---

## 🔄 **STATE MANAGEMENT**

### **1. Component State Pattern**

```typescript
// Pattern: Local state untuk UI, Global state untuk data
const EventHero: React.FC<EventHeroProps> = ({ eventId }) => {
  // Global data dari API
  const { eventData } = useEventContent(eventId);
  
  // Local UI state
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <div>
      {/* Component content */}
    </div>
  );
};
```

### **2. Plugin State Management**

```typescript
// src/hooks/usePluginState.ts
export const usePluginState = (eventType: string, eventId: string) => {
  const plugin = useEventPlugin(eventType);
  const [pluginState, setPluginState] = useState(plugin.getDefaultState?.());
  
  const updatePluginState = (newState: any) => {
    setPluginState(prev => ({ ...prev, ...newState }));
  };
  
  return { pluginState, updatePluginState };
};
```

---

## ⚡ **PERFORMANCE OPTIMIZATION**

### **1. Component Lazy Loading**

```typescript
// src/components/LazyEventComponents.tsx
import { lazy, Suspense } from 'react';
import { ComponentSkeleton } from './ComponentSkeleton';

const EventHero = lazy(() => import('./EventHero'));
const ParticipantsSection = lazy(() => import('./ParticipantsSection'));

export const LazyEventHero = (props: any) => (
  <Suspense fallback={<ComponentSkeleton type="hero" />}>
    <EventHero {...props} />
  </Suspense>
);
```

### **2. Memoization Strategy**

```typescript
import React, { memo, useMemo } from 'react';

export const EventHero = memo<EventHeroProps>(({ eventId, eventType, config }) => {
  const memoizedConfig = useMemo(() => ({
    ...config,
    processedData: expensiveProcessing(config)
  }), [config]);
  
  return (
    <div>
      {/* Component content */}
    </div>
  );
});

// Only re-render if eventId or eventType changes
EventHero.displayName = 'EventHero';
```

### **3. Virtual Scrolling untuk Large Lists**

```typescript
// src/components/VirtualizedParticipantsList.tsx
import { FixedSizeList as List } from 'react-window';

const VirtualizedParticipantsList: React.FC<{ participants: any[] }> = ({ 
  participants 
}) => {
  const Row = ({ index, style }: any) => (
    <div style={style}>
      <ParticipantCard participant={participants[index]} />
    </div>
  );

  return (
    <List
      height={400}
      itemCount={participants.length}
      itemSize={80}
    >
      {Row}
    </List>
  );
};
```

---

## 🔒 **ERROR HANDLING & BOUNDARIES**

### **1. Component Error Boundary**

```typescript
// src/components/EventErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class EventErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Event component error:', error, errorInfo);
    
    // Send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      reportError(error, { component: 'EventComponent', ...errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold text-red-600">
            Something went wrong
          </h3>
          <p className="text-sm text-gray-600">
            Please refresh the page or contact support
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### **2. Plugin Error Handling**

```typescript
// src/hooks/useEventPlugin.ts
export const useEventPlugin = (eventType: string) => {
  const [plugin, setPlugin] = useState<EventPlugin | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const loadedPlugin = pluginRegistry.get(eventType);
      if (!loadedPlugin) {
        setError(`Plugin not found: ${eventType}`);
        return;
      }
      setPlugin(loadedPlugin);
      setError(null);
    } catch (err) {
      setError(`Failed to load plugin: ${err.message}`);
      setPlugin(null);
    }
  }, [eventType]);

  return { plugin, error };
};
```

---

## 📱 **RESPONSIVE DESIGN**

### **1. Mobile-First Approach**

```typescript
// src/components/ResponsiveEventHero.tsx
const ResponsiveEventHero: React.FC<EventHeroProps> = ({ eventData }) => {
  return (
    <div className={cn(
      // Mobile (default)
      "min-h-[300px] px-4 py-8",
      // Tablet
      "md:min-h-[400px] md:px-8 md:py-12",
      // Desktop
      "lg:min-h-[500px] lg:px-12 lg:py-16"
    )}>
      <div className={cn(
        // Mobile layout
        "flex flex-col space-y-4 text-center",
        // Desktop layout
        "lg:flex-row lg:items-center lg:justify-between lg:text-left"
      )}>
        {/* Content */}
      </div>
    </div>
  );
};
```

### **2. Breakpoint Management**

```typescript
// src/hooks/useBreakpoint.ts
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState('sm');

  useEffect(() => {
    const updateBreakpoint = () => {
      if (window.innerWidth >= 1024) setBreakpoint('lg');
      else if (window.innerWidth >= 768) setBreakpoint('md');
      else setBreakpoint('sm');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
};
```

---

## 🧪 **TESTING STRATEGY**

### **1. Component Unit Tests**

```typescript
// __tests__/components/EventHero.test.tsx
import { render, screen } from '@testing-library/react';
import { EventHero } from '@/components/EventHero';
import { mockEventData } from '@/test/mocks';

describe('EventHero', () => {
  it('renders event hero with plugin data', () => {
    render(
      <EventHero 
        eventId="test-event"
        eventType="wedding"
        config={{ showCountdown: true }}
      />
    );
    
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('shows error state when plugin not found', () => {
    render(
      <EventHero 
        eventId="test-event"
        eventType="unknown"
      />
    );
    
    expect(screen.getByText(/plugin not found/i)).toBeInTheDocument();
  });
});
```

### **2. Plugin Integration Tests**

```typescript
// __tests__/plugins/wedding-integration.test.tsx
describe('Wedding Plugin Integration', () => {
  it('renders wedding components correctly', () => {
    const { plugin } = useEventPlugin('wedding');
    const heroComponent = plugin.renderHero(mockWeddingData, {});
    
    render(heroComponent);
    expect(screen.getByText(mockWeddingData.brideName)).toBeInTheDocument();
  });
});
```

---

## 📊 **PERFORMANCE MONITORING**

### **1. Component Performance Tracking**

```typescript
// src/utils/performance.ts
export const measureComponentPerformance = (componentName: string) => {
  return function(Component: React.ComponentType<any>) {
    return function WrappedComponent(props: any) {
      useEffect(() => {
        const startTime = performance.now();
        
        return () => {
          const endTime = performance.now();
          const renderTime = endTime - startTime;
          
          if (renderTime > 16) { // > 16ms is concerning for 60fps
            console.warn(`${componentName} slow render:`, renderTime);
          }
        };
      });
      
      return <Component {...props} />;
    };
  };
};

// Usage
export default measureComponentPerformance('EventHero')(EventHero);
```

---

## 🚀 **DEPLOYMENT CONSIDERATIONS**

### **1. Bundle Optimization**

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'event-core': ['src/components/EventHero', 'src/components/EventDetails'],
          'plugins': ['src/plugins/wedding', 'src/plugins/conference'],
          'ui': ['src/components/ui']
        }
      }
    }
  }
});
```

### **2. Progressive Enhancement**

```typescript
// src/components/ProgressiveEventHero.tsx
export const ProgressiveEventHero = ({ eventId, eventType }) => {
  const [isEnhanced, setIsEnhanced] = useState(false);

  useEffect(() => {
    // Load advanced features only if browser supports them
    if (window.IntersectionObserver && window.requestIdleCallback) {
      setIsEnhanced(true);
    }
  }, []);

  return (
    <div>
      {/* Basic content always shown */}
      <BasicEventHero eventId={eventId} eventType={eventType} />
      
      {/* Enhanced features loaded progressively */}
      {isEnhanced && (
        <EnhancedFeatures eventId={eventId} eventType={eventType} />
      )}
    </div>
  );
};
```

---

## 📚 **BEST PRACTICES SUMMARY**

### **Do's ✅**
- Keep components small and focused
- Use TypeScript untuk type safety
- Implement proper error boundaries
- Follow mobile-first responsive design
- Use memoization untuk performance
- Write comprehensive tests
- Document component APIs

### **Don'ts ❌**
- Avoid deep component nesting (>5 levels)
- Don't put business logic di render functions
- Avoid inline styles (use CSS classes)
- Don't ignore accessibility requirements
- Avoid unnecessary re-renders
- Don't skip error handling
- Avoid tightly coupled components

---

## 🔗 **RELATED DOCUMENTATION**

- [Plugin System Technical Documentation](./PLUGIN_SYSTEM_TECHNICAL_DOCUMENTATION.md)
- [Event Type Creation Tutorial](./EVENT_TYPE_CREATION_TUTORIAL.md)
- [Form Builder Usage Guide](./FORM_BUILDER_USAGE_GUIDE.md)
- [Plugin Developer Guide](./PLUGIN_DEVELOPER_GUIDE.md)

---

**Happy Component Development! 🎨**