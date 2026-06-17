export const de = {
  common: {
    technicalDemo: 'Technische Demo',
    demoNotice:
      'Bitte geben Sie keine sensiblen oder echten personenbezogenen Daten ein. Demo-Daten können jederzeit zurückgesetzt oder gelöscht werden.',
    createEvent: 'Event erstellen',
    create: 'Erstellen',
    cancel: 'Abbrechen',
    save: 'Speichern',
    close: 'Schließen',
    tryAgain: 'Erneut versuchen',
    notConnected: 'Nicht verbunden',
    liveSync: 'Live-Synchronisierung',
  },
  createEventDialog: {
    title: 'Erstelle dein Event',
    organizedBy: 'Es wird von {{name}} organisiert.',
    eventTitle: 'Eventtitel',
    eventTitlePlaceholder: 'Design-Systems-Meetup',
    dateAndTime: 'Datum und Uhrzeit',
    durationInHours: 'Dauer in Stunden',
    venue: 'Veranstaltungsort',
    venuePlaceholder: 'Factory Berlin',
    country: 'Land',
    selectCountry: 'Land auswählen',
    city: 'Stadt',
    cityPlaceholder: 'Berlin',
    address: 'Adresse',
    date: 'Datum',
    time: 'Uhrzeit',
    addressPlaceholder: 'Lohmühlenstraße 65',
    postalCode: 'Postleitzahl',
    postalCodePlaceholder: '12435',
    errors: {
      eventMustNotEndInPast: 'Die Veranstaltung darf nicht in der Vergangenheit enden.',
      deletionDateMustBeInFuture: 'Das Löschdatum muss in der Zukunft liegen.',
    },
  },

  events: {
    header: {
      title: 'Events in Echtzeit',
      subtitle: 'Events',
    },
    sidebar: {
      calendarLabel: 'Eventkalender',
    },
    titles: {
      allEvents: 'Alle Events',
      activeEvents: 'Aktive Events',
      joinedEvents: 'Teilgenommene Events',
    },
    filters: {
      all: 'Alle',
      active: 'Aktiv',
      joined: 'Teilgenommen',
    },
    empty: {
      defaultTitle: 'Noch keine Events',
      activeTitle: 'Keine aktiven Events',
      joinedTitle: 'Keine teilgenommenen Events',
      defaultDescription:
        'Im Service erstellte Events erscheinen hier automatisch.',
      activeDescription:
        'Abgesagte und abgeschlossene Events werden durch den Aktiv-Filter ausgeblendet.',
      joinedDescription:
        'Es werden nur Events angezeigt, denen der aktuelle Benutzer beigetreten ist, einschließlich abgesagter und abgeschlossener Events.',
    },
    errors: {
      unableToLoadEvents: 'Events konnten nicht geladen werden',
      updateEvent: 'Das Event konnte nicht aktualisiert werden.',
      cancelEvent: 'Das Event konnte nicht abgesagt werden.',
      restoreEvent: 'Das Event konnte nicht wiederhergestellt werden.',
      createEvent: 'Das Event konnte nicht erstellt werden.',
      updateSelectedEvent: 'Das Event konnte nicht aktualisiert werden.',
    },
    user: {
      changeUser: 'Benutzer wechseln',
    },
    selectionPrompt: 'Wählen Sie ein Event aus, um die Details zu sehen.',
    appTitle: 'Events in Echtzeit',
    appSubtitle: 'Events',
    eventCalendar: 'Eventkalender',
    allEvents: 'Alle Events',
    activeEvents: 'Aktive Events',
    joinedEvents: 'Teilgenommene Events',
    all: 'Alle',
    active: 'Aktiv',
    joined: 'Teilgenommen',
    unableToLoadEvents: 'Events konnten nicht geladen werden',
    selectEvent: 'Wählen Sie ein Event aus, um die Details zu sehen.',
    noEventsYet: 'Noch keine Events',
    noActiveEvents: 'Keine aktiven Events',
    noJoinedEvents: 'Keine teilgenommenen Events',
    noEventsDescription:
      'Im Service erstellte Events erscheinen hier automatisch.',
    noActiveEventsDescription:
      'Abgesagte und abgeschlossene Events werden durch den Aktiv-Filter ausgeblendet.',
    noJoinedEventsDescription:
      'Es werden nur Events angezeigt, denen der aktuelle Benutzer beigetreten ist, einschließlich abgesagter und abgeschlossener Events.',
  },
  welcome: {
    title: 'Willkommen bei Events RealTime',
    question: 'Wie dürfen wir dich nennen?',
    description: 'Wähle einen Namen, damit andere dich erkennen können, wenn du Events erstellst oder ihnen beitrittst.',
  },
  eventDetail: {
    status: {
      canceled: 'Abgesagt',
      completed: 'Abgeschlossen',
      inProgress: 'Läuft gerade',
      open: 'Offenes Event',
      joined: 'Teilgenommen',
    },
    eventId: 'Event #{{id}}',
    organizedBy: 'Organisiert von',
    actions: {
      enterNameToJoin: 'Gib deinen Namen ein, um teilzunehmen',
      editEvent: 'Event bearbeiten',
      restoreEvent: 'Event wiederherstellen',
      eventCompleted: 'Event abgeschlossen',
      cancelEvent: 'Event absagen',
      leaveEvent: 'Event verlassen',
      joinEvent: 'Event beitreten',
    },
    details: {
      date: 'Datum',
      timeAndDuration: 'Uhrzeit und Dauer',
      organizer: 'Organisator',
    },
    location: {
      title: 'Ort',
      noAddressDetails: 'Keine Adressdetails angegeben.',
    },
    joiners: {
      title: 'Teilnehmende Personen',
      attendeeCount_one: '{{count}} Person',
      attendeeCount_other: '{{count}} Personen',
      empty: 'Noch hat niemand teilgenommen.',
    },
  },
  formatters: {
    TBD: 'Uhrzeit noch nicht festgelegt',
  },
  eventList: {
    empty: {
      title: 'Noch keine Events',
      description:
        'Im Service erstellte Events erscheinen hier automatisch.',
    },
    status: {
      joined: 'Teilgenommen',
      canceled: 'Abgesagt',
      completed: 'Abgeschlossen',
      inProgress: 'Läuft gerade',
    },
    joiners: {
      joiningCount_one: '{{count}} Person nimmt teil',
      joiningCount_other: '{{count}} Personen nehmen teil',
    },
  },
  editEventDialog: {
    title: 'Event bearbeiten',
    description: 'Aktualisiere die Eventdetails und den aktuellen Ort.',
    currentLocation: 'Aktueller Ort',
    sharedLocationWarning:
      'Wenn du einen gemeinsam genutzten Ort aktualisierst, werden auch andere Events aktualisiert, die ihn verwenden.',
    noCountrySelected: 'Kein Land ausgewählt',
    saveChanges: 'Änderungen speichern',
    validation: {
      locationRequired: 'Gib einen Veranstaltungsort oder eine Adresse ein.',
    },
    errors: {
      eventMustNotEndInPast: 'Die Veranstaltung darf nicht in der Vergangenheit enden.',
    },
  }
}
