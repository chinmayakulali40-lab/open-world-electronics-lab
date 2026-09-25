import bcrypt from 'bcryptjs';
import { Role, SharePermission } from '@prisma/client';
import { prisma } from './config/db';

async function main() {
  console.log('🌱 Starting database seeding for Open-World Electronics Lab...');

  // Clean existing records in reverse dependency order
  await prisma.simulationLog.deleteMany();
  await prisma.projectShare.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ Cleaned existing database tables');

  // Password hash for all demo users: "Password123!"
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  // 1. Create Users
  const teacher = await prisma.user.create({
    data: {
      fullName: 'Prof. Vikram Rao',
      email: 'teacher@lab.edu',
      phone: '+91 98765 00001',
      passwordHash,
      role: Role.TEACHER,
    },
  });

  const studentA = await prisma.user.create({
    data: {
      fullName: 'Aarav Sharma',
      email: 'student@lab.edu',
      phone: '+91 98765 00002',
      passwordHash,
      role: Role.STUDENT,
    },
  });

  const studentB = await prisma.user.create({
    data: {
      fullName: 'Dr. Evelyn Reed',
      email: 'evelyn@lab.edu',
      phone: '+91 98765 00003',
      passwordHash,
      role: Role.STUDENT,
    },
  });

  const admin = await prisma.user.create({
    data: {
      fullName: 'Lab Administrator',
      email: 'admin@lab.edu',
      phone: '+91 98765 00004',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log('✓ Created users: Teacher, Students (Aarav & Evelyn), Admin');

  // 2. Create Projects
  const project1 = await prisma.project.create({
    data: {
      title: 'Solar PV Irradiance Monitor',
      description: 'Dynamic photovoltaic module coupled with real-time solar irradiance (0-1000 W/m²), DMM load testing, and live Voc voltage output curve.',
      shareCode: 'proj_solar_pv',
      authorId: studentA.id,
      environmentData: {
        sunlight: 850,
        temperature: 31,
        clouds: 5,
        location: 'Farm',
      },
      schematicData: {
        parts: [
          { id: 'part-solar-1', type: 'solar', name: 'Solar PV Panel', x: 260, y: 160 },
          { id: 'part-dmm-1', type: 'dmm', name: 'Digital Multimeter', x: 620, y: 160 },
          { id: 'part-gnd-1', type: 'gnd', name: 'Ground', x: 260, y: 360 },
        ],
        wires: [
          { id: 'w-solar-1', fromPart: 'part-solar-1', fromPin: 'v_pos', toPart: 'part-dmm-1', toPin: 'dmm_v' },
          { id: 'w-solar-2', fromPart: 'part-solar-1', fromPin: 'v_neg', toPart: 'part-dmm-1', toPin: 'dmm_com' },
          { id: 'w-solar-3', fromPart: 'part-solar-1', fromPin: 'v_neg', toPart: 'part-gnd-1', toPin: 'gnd' },
        ],
      },
    },
  });

  const project2 = await prisma.project.create({
    data: {
      title: 'ESP32 IoT Weather Node',
      description: 'Dual-core ESP32 DevKit reading ambient temperature & light, blinking IO2 status LED, and transmitting ADC telemetry.',
      shareCode: 'proj_esp32_iot',
      authorId: studentB.id,
      environmentData: {
        sunlight: 550,
        temperature: 28,
        clouds: 10,
        location: 'Classroom',
      },
      schematicData: {
        parts: [
          { id: 'part-solar-esp', type: 'solar', name: 'Solar PV Panel', x: 220, y: 150 },
          { id: 'part-esp32-1', type: 'esp32', name: 'ESP32 NodeMCU DevKit', x: 500, y: 120 },
          { id: 'part-dmm-esp', type: 'dmm', name: 'Digital Multimeter', x: 780, y: 150 },
        ],
        wires: [
          { id: 'w-esp-1', fromPart: 'part-solar-esp', fromPin: 'v_pos', toPart: 'part-esp32-1', toPin: 'D34' },
          { id: 'w-esp-2', fromPart: 'part-solar-esp', fromPin: 'v_neg', toPart: 'part-esp32-1', toPin: 'GND_L' },
          { id: 'w-esp-3', fromPart: 'part-esp32-1', fromPin: '3V3', toPart: 'part-dmm-esp', toPin: 'dmm_v' },
          { id: 'w-esp-4', fromPart: 'part-esp32-1', fromPin: 'GND_R', toPart: 'part-dmm-esp', toPin: 'dmm_com' },
        ],
      },
    },
  });

  const project3 = await prisma.project.create({
    data: {
      title: 'Arduino + LDR Smart Streetlight',
      description: 'Automated night-time streetlight activation system using ATmega328P ADC input from photoresistor divider driving Digital Pin 13 LED.',
      shareCode: 'proj_arduino_ldr',
      authorId: studentA.id,
      environmentData: {
        sunlight: 200,
        temperature: 22,
        clouds: 15,
        location: 'Road',
      },
      schematicData: {
        parts: [
          { id: 'part-mcu-1', type: 'arduino_uno', name: 'Arduino Uno R3', x: 280, y: 130 },
          { id: 'part-ldr-1', type: 'ldr', name: 'LDR Photoresistor', x: 620, y: 110 },
          { id: 'part-res-1', type: 'resistor', name: '10kΩ Pull-down', x: 620, y: 230 },
          { id: 'part-led-1', type: 'led', name: 'Streetlight LED', x: 620, y: 350 },
          { id: 'part-dmm-1', type: 'dmm', name: 'Digital Multimeter', x: 860, y: 190 },
        ],
        wires: [
          { id: 'w-1', fromPart: 'part-mcu-1', fromPin: '5V', toPart: 'part-ldr-1', toPin: 'p1' },
          { id: 'w-2', fromPart: 'part-ldr-1', fromPin: 'p2', toPart: 'part-mcu-1', toPin: 'A0' },
          { id: 'w-3', fromPart: 'part-ldr-1', fromPin: 'p2', toPart: 'part-res-1', toPin: 'p1' },
          { id: 'w-4', fromPart: 'part-res-1', fromPin: 'p2', toPart: 'part-mcu-1', toPin: 'GND_1' },
          { id: 'w-5', fromPart: 'part-mcu-1', fromPin: 'D13', toPart: 'part-led-1', toPin: 'anode' },
          { id: 'w-6', fromPart: 'part-led-1', fromPin: 'cathode', toPart: 'part-mcu-1', toPin: 'GND_2' },
        ],
      },
    },
  });

  const project4 = await prisma.project.create({
    data: {
      title: 'Proteus Multi-Instrument Test Bench',
      description: 'Comprehensive test-bench setup with Digital Multimeter, 2-Channel Real-time Oscilloscope, DC Power Supply, and Potentiometer.',
      shareCode: 'proj_bench_lab',
      authorId: teacher.id,
      environmentData: {
        sunlight: 400,
        temperature: 24,
        clouds: 0,
        location: 'Classroom',
      },
      schematicData: {
        parts: [
          { id: 'part-dmm-bench', type: 'dmm', name: 'Digital Multimeter', x: 300, y: 160 },
          { id: 'part-scope-bench', type: 'scope', name: '2-CH Oscilloscope', x: 580, y: 160 },
          { id: 'part-pot-bench', type: 'potentiometer', name: '100kΩ Potentiometer', x: 440, y: 340 },
        ],
        wires: [],
      },
    },
  });

  console.log('✓ Created 4 lab projects with schematic & netlist wire data');

  // 3. Create Project Collaboration Shares
  await prisma.projectShare.createMany({
    data: [
      { projectId: project1.id, userId: teacher.id, permission: SharePermission.EDITOR },
      { projectId: project1.id, userId: studentB.id, permission: SharePermission.VIEWER },
      { projectId: project2.id, userId: studentA.id, permission: SharePermission.EDITOR },
      { projectId: project4.id, userId: studentA.id, permission: SharePermission.VIEWER },
      { projectId: project4.id, userId: studentB.id, permission: SharePermission.VIEWER },
    ],
  });

  console.log('✓ Created role-based project collaboration shares (VIEWER / EDITOR)');

  // 4. Create Simulation Logs for Analytics
  await prisma.simulationLog.createMany({
    data: [
      {
        projectId: project1.id,
        runDurationSec: 420,
        componentCount: 3,
        peakVoltage: 4.88,
        peakPower: 122.5,
        environmentUsed: 'Farm',
      },
      {
        projectId: project1.id,
        runDurationSec: 610,
        componentCount: 4,
        peakVoltage: 4.95,
        peakPower: 135.0,
        environmentUsed: 'Farm',
      },
      {
        projectId: project2.id,
        runDurationSec: 850,
        componentCount: 3,
        peakVoltage: 3.30,
        peakPower: 45.2,
        environmentUsed: 'Classroom',
      },
      {
        projectId: project3.id,
        runDurationSec: 340,
        componentCount: 5,
        peakVoltage: 5.00,
        peakPower: 88.0,
        environmentUsed: 'Road',
      },
      {
        projectId: project4.id,
        runDurationSec: 1200,
        componentCount: 3,
        peakVoltage: 3.26,
        peakPower: 42.5,
        environmentUsed: 'Classroom',
      },
    ],
  });

  console.log('✓ Seeded simulation logs and telemetry data for teacher analytics');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
