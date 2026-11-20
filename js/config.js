/* =====================================================================
   TISBMUN XXVI: settings you update as things are confirmed.
   Paths are from the site's top folder, e.g. "docs/icj-background-guide.pdf".
   Use null for anything not ready yet; the site shows "Coming soon".
   ===================================================================== */
window.TISBMUN = {

  /* Registration link. Every Register button on the site uses this. */
  registrationUrl: "https://events.tisb.org/mun/",

  /* Conference documents shown on the home page */
  documents: [
    { title: "Rules of Procedure", file: null },
    { title: "Code of Conduct",    file: null },
    { title: "Delegate Resources", file: null },
    { title: "Brochure",           file: null },
    { title: "Schedule",           file: null },
  ],

  /* Per committee: agenda text, background guide PDF, country matrix PDF */
  committees: {
    aippm:    { agenda: null, guide: null, matrix: null },
    unoosa:   { agenda: null, guide: null, matrix: null },
    ecosoc:   { agenda: null, guide: null, matrix: null },
    disec:    { agenda: null, guide: null, matrix: null },
    unhrc:    { agenda: null, guide: null, matrix: null },
    unsc:     { agenda: null, guide: null, matrix: null },
    icj:      { agenda: null, guide: null, matrix: null },
    ccc:      { agenda: null, guide: null, matrix: null },
    starwars: { agenda: null, guide: null, matrix: null },
  },
};
