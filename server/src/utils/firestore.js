// Converts a Firestore snapshot into a plain object: adds `id`, and turns any
// Firestore Timestamp fields into ISO strings so API responses match what the
// frontend already expects from the old Sequelize-based API.
export function docToObject(doc) {
  if (!doc.exists) return null;
  const data = doc.data();
  const result = { id: doc.id };
  for (const [key, value] of Object.entries(data)) {
    result[key] = value && typeof value.toDate === "function" ? value.toDate().toISOString() : value;
  }
  return result;
}

export function snapshotToArray(snapshot) {
  return snapshot.docs.map(docToObject);
}
