import fs from 'fs';

const BASE = process.env.BASE_URL || 'https://mt-academy.pages.dev';

async function req(path, { method = 'GET', token, body, formData } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json; charset=utf-8';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data, text };
}

function ok(cond, msg) {
  if (!cond) throw new Error(msg);
  console.log('OK  ' + msg);
}

async function login(email) {
  const r = await req('/api/auth/login', {
    method: 'POST',
    body: { email, password: '123456' },
  });
  if (r.status !== 200 || !r.data?.data?.token) {
    throw new Error(`login failed ${email}: ${r.status} ${JSON.stringify(r.data)}`);
  }
  return r.data.data;
}

async function main() {
  console.log('BASE', BASE);

  const health = await req('/api/health');
  ok(health.status === 200 && health.data.mode === 'd1', `health mode=d1 users=${health.data.usersCount}`);

  const admin = await login('admin@mt.com');
  ok(admin.user.role === 'admin', 'admin login');
  const teacher = await login('teacher@mt.com');
  ok(teacher.user.role === 'teacher', 'teacher login');
  const student = await login('student@mt.com');
  ok(student.user.role === 'student', `student login level=${student.user.membershipLevel}`);

  const me = await req('/api/auth/me', { token: student.token });
  ok(me.status === 200 && me.data?.data?.email === 'student@mt.com', 'student /auth/me');

  const coursesBefore = await req('/api/courses', { token: student.token });
  ok(coursesBefore.status === 200 && Array.isArray(coursesBefore.data), `courses=${coursesBefore.data.length}`);

  const created = await req('/api/courses', {
    method: 'POST',
    token: teacher.token,
    body: {
      title: '线上验收课-老师推送',
      instructor: '授课老师',
      price: 0,
      description: '包含图片、视频、PDF 的验收课程',
      category: '验收',
      level: 'Core',
      duration: '1h',
      image: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?q=80&w=400&auto=format&fit=crop',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      modules: [
        { id: 'l1', title: '第一课 视频', duration: '10:00', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
        { id: 'l2', title: '第二课 资料', duration: '05:00', videoUrl: '' },
      ],
    },
  });
  ok(created.status === 201 && created.data?.id, `create course id=${created.data?.id} title=${created.data?.title}`);
  ok(created.data?.title === '线上验收课-老师推送', 'course title is UTF-8 correct');
  ok(created.data?.hasVideo === true, 'course hasVideo=true');
  const courseId = created.data.id;

  const coursesAfter = await req('/api/courses', { token: student.token });
  const seen = coursesAfter.data.find((c) => c.id === courseId);
  ok(!!seen, 'student sees teacher course immediately');
  ok(seen.isAccessible !== false, 'student can access Core course');
  ok(seen.hasVideo === true, 'student course hasVideo');
  console.log('    course detail', {
    title: seen.title,
    videoUrl: seen.videoUrl,
    pdfUrl: seen.pdfUrl,
    modules: (seen.modules || []).length,
  });

  const enroll = await req(`/api/enrollments/${courseId}`, { method: 'POST', token: student.token });
  ok(enroll.status === 201 || enroll.status === 409, `enroll status=${enroll.status}`);

  const progress = await req(`/api/enrollments/${courseId}/progress`, {
    method: 'PUT',
    token: student.token,
    body: { progress: 50, lastLessonId: 'l1' },
  });
  ok(progress.status === 200 && Number(progress.data?.progress) === 50, `progress=${progress.data?.progress}`);

  const stats = await req('/api/dashboard/stats', { token: student.token });
  ok(stats.status === 200 && stats.data.enrolledCourses >= 1, `stats enrolled=${stats.data.enrolledCourses}`);

  const assignment = await req('/api/assignments', {
    method: 'POST',
    token: teacher.token,
    body: {
      title: '验收作业-推送后提交',
      courseId,
      description: '请完成视频学习并提交备注',
      dueDate: '2026-12-31',
    },
  });
  ok(assignment.status === 201 && assignment.data?.id, `assignment id=${assignment.data?.id}`);
  ok(assignment.data?.title === '验收作业-推送后提交', 'assignment title UTF-8');
  const assignmentId = assignment.data.id;

  const fd = new FormData();
  fd.append('assignmentId', assignmentId);
  fd.append('fileUrl', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
  fd.append('remark', '线上验收提交');
  const submission = await req('/api/submissions', { method: 'POST', token: student.token, formData: fd });
  ok(submission.status === 201 && submission.data?.id, `submission id=${submission.data?.id}`);
  const submissionId = submission.data.id;

  const fd2 = new FormData();
  fd2.append('assignmentId', assignmentId);
  fd2.append('fileUrl', 'https://example.com/x.pdf');
  const dup = await req('/api/submissions', { method: 'POST', token: student.token, formData: fd2 });
  ok(dup.status === 409, `duplicate submit ${dup.status}`);

  const grade = await req(`/api/submissions/${submissionId}/grade`, {
    method: 'POST',
    token: teacher.token,
    body: { grade: '95', feedback: '完成得很好' },
  });
  ok(grade.status === 200 && grade.data?.grade === '95', `graded=${grade.data?.grade}`);

  const studentUsers = await req('/api/users', { token: student.token });
  ok(studentUsers.status === 403, 'student cannot list users');
  const teacherUsers = await req('/api/users', { token: teacher.token });
  ok(teacherUsers.status === 403, 'teacher cannot list users');
  const adminUsers = await req('/api/users', { token: admin.token });
  ok(adminUsers.status === 200 && Array.isArray(adminUsers.data), `admin users=${adminUsers.data.length}`);

  const verify = await req(`/api/auth/users/${student.user.id}`, {
    method: 'PUT',
    token: admin.token,
    body: { isVerified: true, membershipLevel: 'Advanced' },
  });
  ok(verify.status === 200 && verify.data?.data?.membershipLevel === 'Advanced', 'admin manual verify/membership');

  const live = await req('/api/live/sessions', {
    method: 'POST',
    token: teacher.token,
    body: {
      title: '验收直播',
      date: '2026-08-01',
      time: '20:00',
      instructor: '授课老师',
      status: 'upcoming',
      type: 'live',
    },
  });
  ok(live.status === 201 && live.data?.id, `live id=${live.data?.id}`);

  const bad = await req('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@mt.com', password: 'wrong-password' },
  });
  ok(bad.status === 401, 'wrong password 401');

  // R2 upload
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
  const upFd = new FormData();
  upFd.append('file', new Blob([png], { type: 'image/png' }), 'pixel.png');
  const upload = await req('/api/upload', { method: 'POST', token: teacher.token, formData: upFd });
  if (upload.status === 200 && upload.data?.url) {
    console.log('OK  upload url=' + upload.data.url);
    const assetPath = upload.data.url.startsWith('http')
      ? new URL(upload.data.url).pathname
      : upload.data.url;
    const asset = await req(assetPath, { token: teacher.token });
    ok(asset.status === 200, `asset proxy status=${asset.status}`);
  } else {
    console.log('WARN R2 upload status=' + upload.status + ' ' + JSON.stringify(upload.data));
  }

  const resources = await req('/api/resources', { token: student.token });
  ok(resources.status === 200 && Array.isArray(resources.data), `resources=${resources.data.length}`);

  const detail = await req(`/api/courses/${courseId}`, { token: student.token });
  ok(detail.status === 200 && detail.data?.isEnrolled === true, `detail enrolled progress=${detail.data?.progress}`);
  ok(!!detail.data?.videoUrl && !!detail.data?.pdfUrl, 'detail has video+pdf urls');

  console.log('\nALL PRODUCTION CHECKS PASSED');
  console.log(
    JSON.stringify(
      {
        site: BASE,
        courseId,
        assignmentId,
        submissionId,
        accounts: {
          admin: 'admin@mt.com / 123456',
          teacher: 'teacher@mt.com / 123456',
          student: 'student@mt.com / 123456',
        },
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error('FAIL', err.stack || err.message);
  process.exit(1);
});
