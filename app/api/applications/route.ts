import { cleanText, ensureDatabase, getDatabase, parseList } from "../../../lib/database";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const fullName = cleanText(body.fullName, 120);
    const email = cleanText(body.email, 160).toLowerCase();
    const whatsapp = cleanText(body.whatsapp, 60);
    const consent = body.consent === true;
    const website = cleanText(body.website, 100);

    if (website) return Response.json({ ok: true }, { status: 201 });
    if (!fullName || !email || !whatsapp) {
      return Response.json({ error: "Name, email and WhatsApp are required." }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (!consent) {
      return Response.json({ error: "Please confirm the application declaration." }, { status: 400 });
    }

    await ensureDatabase();
    const db = await getDatabase();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const daysAvailable = parseList(body.daysAvailable);
    const equipment = parseList(body.equipment);
    const trackingReadiness = parseList(body.trackingReadiness);
    const urgencyRaw = Number(body.goalUrgency);
    const goalUrgency = Number.isFinite(urgencyRaw)
      ? Math.max(1, Math.min(10, Math.round(urgencyRaw)))
      : 5;

    await db.batch([
      db.prepare(`INSERT INTO people (
        id, kind, status, full_name, email, whatsapp, city_country, age,
        primary_goal, goal_detail, goal_urgency, training_age,
        preferred_frequency, session_length, access_type, days_available,
        equipment, pain_context, consistency_barrier, tracking_readiness,
        application_data, created_at, updated_at
      ) VALUES (?, 'lead', 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(
          id,
          fullName,
          email,
          whatsapp,
          cleanText(body.cityCountry, 120),
          cleanText(body.age, 10),
          cleanText(body.primaryGoal, 80),
          cleanText(body.goalDetail, 1200),
          goalUrgency,
          cleanText(body.trainingAge, 80),
          cleanText(body.preferredFrequency, 60),
          cleanText(body.sessionLength, 60),
          cleanText(body.accessType, 80),
          JSON.stringify(daysAvailable),
          JSON.stringify(equipment),
          cleanText(body.painContext, 800),
          cleanText(body.consistencyBarrier, 800),
          JSON.stringify(trackingReadiness),
          JSON.stringify({ ...body, website: undefined }),
          now,
          now,
        ),
      db.prepare("INSERT INTO activities (id, person_id, type, summary, created_at) VALUES (?, ?, 'application', ?, ?)")
        .bind(crypto.randomUUID(), id, `${fullName} submitted a coaching application.`, now),
    ]);

    return Response.json(
      { ok: true, reference: `GD-${id.slice(0, 8).toUpperCase()}` },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit application.";
    return Response.json({ error: message }, { status: 500 });
  }
}
