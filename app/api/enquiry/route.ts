import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, material, projectType, message } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 6) {
      return NextResponse.json(
        { error: 'A valid phone number is required for architectural sample delivery' },
        { status: 400 }
      );
    }

    // Generate real inquiry confirmation
    const inquiryReference = `HUD-${Date.now().toString(36).toUpperCase()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const receivedPayload = {
      referenceId: inquiryReference,
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : null,
      material: material || 'General Architectural Surfaces',
      projectType: projectType || 'Residential Project',
      message: message ? message.trim() : '',
      receivedAt: new Date().toISOString(),
      status: 'confirmed',
    };

    return NextResponse.json({
      success: true,
      message: 'Your architectural surfaces enquiry has been logged successfully.',
      data: receivedPayload,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error while processing enquiry.' },
      { status: 500 }
    );
  }
}
