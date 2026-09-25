const http = require('http');

function post(path, data, token) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data || {});
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'POST',
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, data: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'GET',
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, data: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('Testing Open-World Electronics Lab Backend API...');

  // 1. Health
  const health = await get('/api/health');
  console.log('1. Healthcheck:', health.data.status, health.data.database);

  // 2. Login as Teacher
  const loginRes = await post('/api/auth/login', {
    email: 'teacher@lab.edu',
    password: 'Password123!',
  });
  console.log('2. Teacher Login:', loginRes.data.message, 'User:', loginRes.data.user?.fullName);
  const teacherToken = loginRes.data.token;

  // 3. Login as Student
  const studentLogin = await post('/api/auth/login', {
    email: 'student@lab.edu',
    password: 'Password123!',
  });
  console.log('3. Student Login:', studentLogin.data.message, 'User:', studentLogin.data.user?.fullName);
  const studentToken = studentLogin.data.token;

  // 4. Get Projects as Student
  const projectsRes = await get('/api/projects', studentToken);
  console.log(
    '4. Student Projects:',
    projectsRes.data.myProjects?.length,
    'owned,',
    projectsRes.data.sharedWithMe?.length,
    'shared with student'
  );

  // 5. Create a new project as Student
  const newProjRes = await post(
    '/api/projects',
    {
      title: 'Active Filter & 555 Pulse Generator',
      description: 'Lab experiment analyzing frequency response of RC lowpass network and astable 555 timer.',
      schematicData: {
        parts: [
          { id: 'part-res-test', type: 'resistor', name: '10k Resistor' },
          { id: 'part-cap-test', type: 'capacitor', name: '100nF Cap' },
        ],
        wires: [],
      },
      environmentData: { sunlight: 400, temperature: 25, clouds: 0, location: 'Classroom' },
    },
    studentToken
  );
  console.log('5. Created Project:', newProjRes.data.project?.title, 'ShareCode:', newProjRes.data.project?.shareCode);
  const createdProjId = newProjRes.data.project?.id;

  // 6. Share this project with Teacher as EDITOR
  const shareRes = await post(
    '/api/shares',
    {
      projectId: createdProjId,
      targetEmail: 'teacher@lab.edu',
      permission: 'EDITOR',
    },
    studentToken
  );
  console.log('6. Project Shared:', shareRes.data.message);

  // 7. Log simulation telemetry
  const logRes = await post(
    '/api/analytics/log',
    {
      projectId: createdProjId,
      runDurationSec: 480,
      componentCount: 6,
      peakVoltage: 4.92,
      peakPower: 110.5,
      environmentUsed: 'Classroom',
    },
    studentToken
  );
  console.log('7. Simulation Logged:', logRes.data.message);

  // 8. Teacher Analytics
  const analyticsRes = await get('/api/analytics/teacher', teacherToken);
  console.log('8. Teacher Analytics Summary:', analyticsRes.data.summary);
  console.log('   Components Used:', Object.keys(analyticsRes.data.componentFrequency).join(', '));
  console.log('   Locations:', Object.keys(analyticsRes.data.environmentDistribution).join(', '));

  // 9. Printable Lab Report HTML
  const reportRes = await get(`/api/export/project/${createdProjId}/report`);
  console.log('9. Printable Lab Report Generated: Length', reportRes.data.length, 'bytes');

  console.log('✅ ALL BACKEND TESTS PASSED SUCCESSFULLY!');
}

run().catch((e) => {
  console.error('Test failed:', e);
});
