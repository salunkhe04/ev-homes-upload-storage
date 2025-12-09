export function getQuarterInfo(date = new Date(), passedQuarter, passedYear) {
  const isQuarterProvided = passedQuarter != null && passedQuarter !== "";
  const isYearProvided =
    passedYear != null && passedYear !== "" && !isNaN(Number(passedYear));

  let quarter;
  let year;
  let startDate;
  let endDate;

  if (isQuarterProvided && isYearProvided) {
    // Use passed quarter and year
    quarter = Number(passedQuarter);
    year = Number(passedYear);
  } else {
    // Fallback to current date
    const month = date.getMonth();
    year = date.getFullYear();
    if (month <= 2) quarter = 1;
    else if (month <= 5) quarter = 2;
    else if (month <= 8) quarter = 3;
    else quarter = 4;
  }

  // Assign start and end dates based on quarter
  switch (quarter) {
    case 1:
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 2, 31, 23, 59, 59, 999);
      break;
    case 2:
      startDate = new Date(year, 3, 1);
      endDate = new Date(year, 5, 30, 23, 59, 59, 999);
      break;
    case 3:
      startDate = new Date(year, 6, 1);
      endDate = new Date(year, 8, 30, 23, 59, 59, 999);
      break;
    case 4:
    default:
      startDate = new Date(year, 9, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      break;
  }

  return { quarter, startDate, endDate, year };
}

export const defaultProjectTargets = [
  { projectId: "project-ev23-malibu-west-koparkhairne-2024", target: 6 },
  { projectId: "project-ev-10-marina-bay-vashi-sector-10", target: 9 },
  { projectId: "project-ev-heart-city-mosare-2025", target: 7 },
  { projectId: "project-ev-9-square-vashi-sector-9", target: 0 },
  //   { projectId: "project-ev-paradise-nerul-2025", target: 4 },
];

export const getQuarterInfoB = (quarter, year) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const resolvedQuarter =
    quarter?.toUpperCase() || `Q${Math.floor(currentMonth / 3) + 1}`;
  const resolvedYear = parseInt(year) || currentYear;

  const quarterMonths = {
    Q1: [0, 2], // Jan-Mar
    Q2: [3, 5], // Apr-Jun
    Q3: [6, 8], // Jul-Sep
    Q4: [9, 11], // Oct-Dec
  };

  const [startMonth, endMonth] = quarterMonths[resolvedQuarter];
  const startDate = new Date(Date.UTC(resolvedYear, startMonth, 1));
  const endDate = new Date(
    Date.UTC(resolvedYear, endMonth + 1, 0, 23, 59, 59, 999)
  );

  return { startDate, endDate, year: resolvedYear, quarter: resolvedQuarter };
};

export const getQuarterRange=(quarter, year)=> {
  if (!quarter || !year) return {};
  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0); // last day of quarter
  return { startDate, endDate };
}
