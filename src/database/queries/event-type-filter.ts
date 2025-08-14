// ================================================================================================
// EVENT TYPE FILTER QUERIES - TRINITY PROTOCOL COMPLIANT
// ================================================================================================
// Query utilities untuk filtering event types
// ================================================================================================

export interface EventTypeFilter {
  type: string;
  category: string;
  isActive: boolean;
}

export const createEventTypeFilter = (type: string, category: string = 'default'): EventTypeFilter => ({
  type,
  category,
  isActive: true
});

export const filterByEventType = (events: any[], filter: EventTypeFilter): any[] => {
  return events.filter(event => event.type === filter.type);
};

export default { createEventTypeFilter, filterByEventType };