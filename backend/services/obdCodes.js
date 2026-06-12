/**
 * Expanded OBD-II Diagnostic Trouble Code (DTC) Lookup Table
 * Covers the 50+ most common powertrain, chassis and body codes.
 */
const OBD_CODES = {
  // Engine Misfires
  P0300: { description: 'Random/Multiple Cylinder Misfire Detected', severity: 'Critical', action: 'Inspect spark plugs, ignition coils, and fuel injectors immediately.' },
  P0301: { description: 'Cylinder 1 Misfire Detected', severity: 'High', action: 'Check spark plug and ignition coil for Cylinder 1.' },
  P0302: { description: 'Cylinder 2 Misfire Detected', severity: 'High', action: 'Check spark plug and ignition coil for Cylinder 2.' },
  P0303: { description: 'Cylinder 3 Misfire Detected', severity: 'High', action: 'Check spark plug and ignition coil for Cylinder 3.' },
  P0304: { description: 'Cylinder 4 Misfire Detected', severity: 'High', action: 'Check spark plug and ignition coil for Cylinder 4.' },

  // Fuel System
  P0171: { description: 'System Too Lean (Bank 1)', severity: 'Medium', action: 'Check for vacuum leaks, faulty MAF sensor, or weak fuel pump.' },
  P0172: { description: 'System Too Rich (Bank 1)', severity: 'Medium', action: 'Inspect fuel injectors, oxygen sensors, and air filter.' },
  P0174: { description: 'System Too Lean (Bank 2)', severity: 'Medium', action: 'Check for vacuum leaks and MAF sensor on Bank 2.' },
  P0175: { description: 'System Too Rich (Bank 2)', severity: 'Medium', action: 'Inspect fuel injectors and oxygen sensors on Bank 2.' },

  // Oxygen Sensors
  P0130: { description: 'O2 Sensor Circuit Malfunction (Bank 1, Sensor 1)', severity: 'Medium', action: 'Replace O2 sensor or inspect wiring harness.' },
  P0131: { description: 'O2 Sensor Circuit Low Voltage (Bank 1, Sensor 1)', severity: 'Medium', action: 'Check O2 sensor and associated wiring.' },
  P0133: { description: 'O2 Sensor Circuit Slow Response (Bank 1, Sensor 1)', severity: 'Low', action: 'O2 sensor aging — replace during next service.' },
  P0135: { description: 'O2 Sensor Heater Circuit Malfunction (Bank 1, Sensor 1)', severity: 'Medium', action: 'Check O2 sensor heater fuse and wiring.' },
  P0141: { description: 'O2 Sensor Heater Circuit Malfunction (Bank 1, Sensor 2)', severity: 'Medium', action: 'Inspect downstream O2 sensor heater circuit.' },

  // Catalytic Converter
  P0420: { description: 'Catalyst System Efficiency Below Threshold (Bank 1)', severity: 'High', action: 'Inspect catalytic converter and exhaust oxygen sensors.' },
  P0430: { description: 'Catalyst System Efficiency Below Threshold (Bank 2)', severity: 'High', action: 'Inspect Bank 2 catalytic converter and oxygen sensors.' },

  // Coolant / Thermostat
  P0115: { description: 'Engine Coolant Temperature Sensor Malfunction', severity: 'High', action: 'Replace coolant temperature sensor. Risk of engine overheating.' },
  P0116: { description: 'Engine Coolant Temperature Sensor Range/Performance', severity: 'Medium', action: 'Inspect coolant temperature sensor and thermostat.' },
  P0117: { description: 'Engine Coolant Temperature Sensor Low Input', severity: 'Medium', action: 'Check sensor wiring and connector for corrosion.' },
  P0118: { description: 'Engine Coolant Temperature Sensor High Input', severity: 'Medium', action: 'Replace sensor or repair wiring short.' },
  P0125: { description: 'Insufficient Coolant Temperature for Closed Loop', severity: 'Low', action: 'Check thermostat operation and coolant level.' },
  P0128: { description: 'Coolant Thermostat Below Operating Temperature', severity: 'Medium', action: 'Replace thermostat — engine running too cool.' },

  // EGR System
  P0401: { description: 'Exhaust Gas Recirculation (EGR) Flow Insufficient', severity: 'Medium', action: 'Clean or replace EGR valve. Check vacuum lines.' },
  P0402: { description: 'EGR Flow Excessive', severity: 'Medium', action: 'Inspect EGR valve for stuck-open condition.' },

  // EVAP System
  P0440: { description: 'Evaporative Emission Control System Malfunction', severity: 'Low', action: 'Check gas cap seal and EVAP system for leaks.' },
  P0441: { description: 'EVAP System Incorrect Purge Flow', severity: 'Low', action: 'Inspect purge valve and vacuum lines.' },
  P0442: { description: 'EVAP System Leak Detected (Small Leak)', severity: 'Low', action: 'Tighten gas cap. If persists, smoke test EVAP system.' },
  P0446: { description: 'EVAP System Vent Control Circuit', severity: 'Low', action: 'Inspect EVAP vent solenoid and wiring.' },
  P0455: { description: 'EVAP System Leak Detected (Gross Leak)', severity: 'Medium', action: 'Major vapor leak — inspect gas cap, hoses, and charcoal canister.' },

  // Ignition System
  P0351: { description: 'Ignition Coil A Primary/Secondary Circuit', severity: 'High', action: 'Replace ignition coil A or inspect wiring.' },
  P0352: { description: 'Ignition Coil B Primary/Secondary Circuit', severity: 'High', action: 'Replace ignition coil B or inspect wiring.' },

  // Throttle / Idle
  P0505: { description: 'Idle Air Control System Malfunction', severity: 'Medium', action: 'Clean or replace idle air control (IAC) valve.' },
  P0507: { description: 'Idle Air Control System RPM Higher Than Expected', severity: 'Low', action: 'Check for vacuum leaks and clean throttle body.' },
  P2135: { description: 'Throttle Position Sensor Correlation', severity: 'Critical', action: 'Throttle body issue — do not drive. Immediate inspection required.' },

  // Transmission
  P0700: { description: 'Transmission Control System Malfunction', severity: 'High', action: 'Transmission fault detected. Schedule diagnostic scan immediately.' },
  P0715: { description: 'Input/Turbine Speed Sensor Circuit', severity: 'High', action: 'Inspect transmission speed sensor and wiring.' },
  P0720: { description: 'Output Speed Sensor Circuit', severity: 'High', action: 'Check output speed sensor — may cause shifting issues.' },
  P0730: { description: 'Incorrect Gear Ratio', severity: 'Critical', action: 'Transmission slipping — immediate service required.' },
  P0741: { description: 'Torque Converter Clutch Solenoid Performance', severity: 'High', action: 'Inspect torque converter clutch solenoid.' },

  // Mass Air Flow
  P0100: { description: 'Mass Air Flow (MAF) Sensor Circuit Malfunction', severity: 'Medium', action: 'Clean or replace MAF sensor.' },
  P0101: { description: 'MAF Sensor Range/Performance', severity: 'Medium', action: 'Clean MAF sensor with MAF cleaner spray.' },
  P0102: { description: 'MAF Sensor Circuit Low Input', severity: 'Medium', action: 'Check MAF sensor connector and wiring.' },

  // Crankshaft / Camshaft
  P0335: { description: 'Crankshaft Position Sensor A Circuit', severity: 'Critical', action: 'Engine may stall — replace crankshaft position sensor immediately.' },
  P0340: { description: 'Camshaft Position Sensor A Circuit (Bank 1)', severity: 'High', action: 'Replace camshaft position sensor.' },
  P0341: { description: 'Camshaft Position Sensor Range/Performance', severity: 'High', action: 'Inspect camshaft sensor and timing chain.' },

  // Knock Sensor
  P0325: { description: 'Knock Sensor 1 Circuit (Bank 1)', severity: 'Medium', action: 'Replace knock sensor or inspect wiring.' },
  P0330: { description: 'Knock Sensor 2 Circuit (Bank 2)', severity: 'Medium', action: 'Replace knock sensor 2 or inspect wiring.' },

  // Battery / Charging
  P0562: { description: 'System Voltage Low', severity: 'High', action: 'Check battery, alternator, and charging system.' },
  P0563: { description: 'System Voltage High', severity: 'Medium', action: 'Inspect voltage regulator and alternator output.' },

  // ABS / Brakes
  C0035: { description: 'Left Front Wheel Speed Sensor Circuit', severity: 'High', action: 'Inspect left front ABS wheel speed sensor.' },
  C0040: { description: 'Right Front Wheel Speed Sensor Circuit', severity: 'High', action: 'Inspect right front ABS wheel speed sensor.' },
  C0050: { description: 'Left Rear Wheel Speed Sensor Circuit', severity: 'High', action: 'Inspect left rear ABS wheel speed sensor.' },
  C0055: { description: 'Right Rear Wheel Speed Sensor Circuit', severity: 'High', action: 'Inspect right rear ABS wheel speed sensor.' },

  // Airbag
  B0100: { description: 'Airbag Deployment Circuit Malfunction', severity: 'Critical', action: 'Airbag system fault — immediate dealer inspection required.' },
};

/**
 * Look up an OBD-II code and return its details.
 * Returns a default entry if the code is not found.
 */
const lookupObdCode = (code) => {
  if (OBD_CODES[code]) return { code, ...OBD_CODES[code] };
  return {
    code,
    description: `Diagnostic Trouble Code ${code} active.`,
    severity: 'Medium',
    action: `Refer to vehicle service manual for code ${code} or visit a certified workshop.`,
  };
};

module.exports = { OBD_CODES, lookupObdCode };
