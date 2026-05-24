/**
 * Mode Toggle Component
 *
 * Phase 1 stub: switches between hobbyist and working-pro modes
 * Full implementation in Phase 3
 */

import React, { useState } from 'react';

type Mode = 'hobbyist' | 'working_pro';

export const ModeToggle: React.FC = () => {
  const [mode, setMode] = useState<Mode>('hobbyist');

  return (
    <div style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
      <label>
        <strong>Mode:</strong>{' '}
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
        >
          <option value="hobbyist">Hobbyist (Skill Growth)</option>
          <option value="working_pro">Working Pro (Consistency)</option>
        </select>
      </label>
      <p style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
        Phase 1 Stub - Mode switching will affect practice planning and critique focus in Phase 3.
      </p>
    </div>
  );
};
