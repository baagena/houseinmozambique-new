/**
 * Leaflet ships no types and @types/leaflet is not a dependency here.
 *
 * MapPicker uses a handful of calls and types them locally, so the only thing
 * missing is the module itself. Declaring it untyped is honest about that —
 * the alternative is adding a dependency for one component.
 */
declare module 'leaflet';
