export default async function handler() {
  const now = new Date();

  console.info("SCHEDULE TEST STARTED");
  console.info("SCHEDULE TEST UTC TIME", {
    isoTime: now.toISOString(),
    utcTime: now.toUTCString()
  });

  return Response.json({
    ok: true,
    message: "SCHEDULE TEST STARTED",
    utcTime: now.toISOString()
  });
}

export const config = {
  schedule: "45 15 22 7 *"
};
