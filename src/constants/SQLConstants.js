/* Constants used for SQL transactionAsync to specify access type

Example:

await db.transactionAsync(async tx => {
    const result = await tx.executeSqlAsync('SELECT COUNT(*) FROM USERS', []);
    console.log('Count:', result.rows[0]['COUNT(*)']);
  }, readOnly);

*/

export const readOnly = true;
export const writable = false;
