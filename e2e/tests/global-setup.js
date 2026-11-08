// Reset the fixed accounts used in the report so every run starts from the same state
const { execSync } = require('child_process');

module.exports = async () => {
  const ids = ['1111111111', '2222222222', '1234567890', '1234567891'];
  execSync(
    `docker exec cubank-mongo mongosh cubank --quiet --eval 'db.users.deleteMany({accountId:{$in:${JSON.stringify(ids)}}})'`,
  );
  const API = 'http://localhost:4000/api/v1/auth/register';
  for (const [accountId, password, name] of [
    ['1111111111', '1234', 'Alice Tester'],
    ['2222222222', '5678', 'Bob Receiver'],
  ]) {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, password, name }),
    });
    if (!res.ok) throw new Error(`seed ${accountId}: ${await res.text()}`);
  }
};
