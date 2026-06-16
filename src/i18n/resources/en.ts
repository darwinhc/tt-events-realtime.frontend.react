// src/i18n/resources/en.ts

export const en = {

  common: {
    technicalDemo: 'Technical demo',
    demoNotice:
      'Please do not enter sensitive or real personal information. Demo data may be reset or deleted at any time.',
    createEvent: 'Create event',
    create: 'Create',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    tryAgain: 'Try again',
    notConnected: 'Not connected',
    liveSync: 'Live sync',
  },
  createEventDialog: {
    title: 'Create your event',
    organizedBy: 'It will be organized by {{name}}.',
    eventTitle: 'Event title',
    eventTitlePlaceholder: 'Design systems meetup',
    dateAndTime: 'Date and time',
    durationInHours: 'Duration in hours',
    venue: 'Venue',
    venuePlaceholder: 'Factory Berlin',
    country: 'Country',
    selectCountry: 'Select a country',
    city: 'City',
    cityPlaceholder: 'Berlin',
    address: 'Address',
    addressPlaceholder: 'Lohmühlenstraße 65',
    postalCode: 'Postal code',
    postalCodePlaceholder: '12435',
  },
  events: {
    sidebar: {
      calendarLabel: 'Event calendar',
    },
    titles: {
      allEvents: 'All events',
      activeEvents: 'Active events',
      joinedEvents: 'Joined events',
    },
    filters: {
      all: 'All',
      active: 'Active',
      joined: 'Joined',
    },
    empty: {
      defaultTitle: 'No events yet',
      activeTitle: 'No active events',
      joinedTitle: 'No joined events',
      defaultDescription:
        'Events created in the service will appear here automatically.',
      activeDescription:
        'Canceled and completed events are hidden by the active filter.',
      joinedDescription:
        'Only events joined by the current user are shown, including canceled and completed events.',
    },
    errors: {
      unableToLoadEvents: 'Unable to load events',
      updateEvent: 'Could not update the event.',
      cancelEvent: 'Could not cancel the event.',
      restoreEvent: 'Could not restore the event.',
      createEvent: 'Could not create the event.',
      updateSelectedEvent: 'Could not update the event.',
    },
    user: {
      changeUser: 'Change user',
    },
    selectionPrompt: 'Select an event to see its details.',
    header: {
      title: 'Events real-time',
      subtitle: 'Events',
    },
    appTitle: 'Events real-time',
    appSubtitle: 'Events',
    eventCalendar: 'Event calendar',
    allEvents: 'All events',
    activeEvents: 'Active events',
    joinedEvents: 'Joined events',
    all: 'All',
    active: 'Active',
    joined: 'Joined',
    unableToLoadEvents: 'Unable to load events',
    selectEvent: 'Select an event to see its details.',
    noEventsYet: 'No events yet',
    noActiveEvents: 'No active events',
    noJoinedEvents: 'No joined events',
    noEventsDescription:
      'Events created in the service will appear here automatically.',
    noActiveEventsDescription:
      'Canceled and completed events are hidden by the active filter.',
    noJoinedEventsDescription:
      'Only events joined by the current user are shown, including canceled and completed events.',
  },
  welcome: {
    title: 'Welcome to Events RealTime',
    question: 'What should we call you?',
    description: 'Your name will identify you when creating or joining events.',
  },
  eventDetail: {
    status: {
      canceled: 'Canceled',
      completed: 'Completed',
      inProgress: 'In progress',
      open: 'Open event',
      joined: 'Joined',
    },
    eventId: 'Event #{{id}}',
    organizedBy: 'Organized by',
    actions: {
      enterNameToJoin: 'Enter your name to join',
      editEvent: 'Edit event',
      restoreEvent: 'Restore event',
      eventCompleted: 'Event completed',
      cancelEvent: 'Cancel event',
      leaveEvent: 'Leave event',
      joinEvent: 'Join event',
    },
    details: {
      date: 'Date',
      timeAndDuration: 'Time and duration',
      organizer: 'Organizer',
    },
    location: {
      title: 'Location',
      noAddressDetails: 'No address details provided.',
    },
    joiners: {
      title: 'People joining',
      attendeeCount_one: '{{count}} attendee',
      attendeeCount_other: '{{count}} attendees',
      empty: 'No one has joined yet.',
    },
  },
  eventList: {
    empty: {
      title: 'No events yet',
      description:
        'Events created in the service will appear here automatically.',
    },
    status: {
      joined: 'Joined',
      canceled: 'Canceled',
      completed: 'Completed',
      inProgress: 'In progress',
    },
    joiners: {
      joiningCount_one: '{{count}} person joining',
      joiningCount_other: '{{count}} people joining',
    },
  },
  editEventDialog: {
    title: 'Edit event',
    description: 'Update the event details and its current location.',
    currentLocation: 'Current location',
    sharedLocationWarning:
      'Updating a shared location also updates other events using it.',
    noCountrySelected: 'No country selected',
    saveChanges: 'Save changes',
    validation: {
      locationRequired: 'Provide a venue name or an address.',
    },
  }
}
