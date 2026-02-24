type SearchableApp = {
  name: string;
  bundleId: string;
  owner: { email: string };
};

export const normalizeSearchQuery = (value: string): string => value.trim().toLowerCase();

export const filterAppsByQuery = <T extends SearchableApp>(apps: T[], query: string): T[] => {
  const normalizedQuery = normalizeSearchQuery(query);

  if (!normalizedQuery) {
    return apps;
  }

  return apps.filter((app) => {
    return [app.name, app.bundleId, app.owner.email].some((field) => {
      return field.toLowerCase().includes(normalizedQuery);
    });
  });
};
