/*
 * content-final.js - Lectures 11 to 15: memory system design, cache, I/O systems,
 * parallel processing and multicore, and ALU design.
 */
(function () {
  'use strict';
  if (!window.Lectures || !window.LK) return;
  var K = LK, w = function (a) { if (window.LecWidgets) LecWidgets.mountAll(a); };
  function svgOf(s, max, label) { return s ? '<svg viewBox="0 0 ' + s.W + ' ' + s.H + '" width="100%" style="max-width:' + (max || s.W) + 'px" role="img" aria-label="' + label + '">' + s.body + '</svg>' : ''; }
  function iod(html) { return '<div class="lesson-iomc">' + html + '</div>'; }

  /* ---------------- Lecture 11 ---------------- */
  Lectures.register('l11', function () {
    var sch = function (m, wd, kb, bus, P) {
      if (!window.MemLogic || !window.Schematic) return '';
      var d = MemLogic.design(m, wd, kb, 'KB', bus, P);
      return svgOf(Schematic.build(m, wd, bus, d.M, P, d.cols, d.rows, d.dl, d.extra), 700, 'Memory system schematic');
    };
    return '' +
'<h3>1. The pieces</h3><p>A memory chip <b>2<sup>m</sup> × w</b> (m address lines, w data lines) is controlled by CS, OE and WE: CS = 0 disables it; with CS = 1, OE = 1 reads and WE = 1 writes (both 1 is invalid). The microprocessor provides address lines (A), data lines (D), <b>R/W*</b> (1 = read, 0 = write) and <b>AS</b> (1 = the address is valid).</p>' +
K.table(['Phase of an instruction', 'AS', 'R/W*', 'Bus activity'], [['Instruction fetch', '1', '1 (read)', 'address = [MAR], loaded from the PC; data lines bring the instruction in'], ['Decode', '0', '–', 'no memory access'], ['Operand store, e.g. MOV $1056, #$98', '1', '0 (write)', 'address = $1056, data = $0098, flowing towards memory']]) +
'<h3>2. The sizing equation</h3><p>The processor needs memory = 2<sup>A</sup> × D bits (A address lines, D-bit data bus). Compare A and D with the chip’s m and w. There are four cases:</p>' +
K.table(['Case', 'Address', 'Data', 'Design'], [['1', 'A = m', 'D = w', 'one chip, wired straight across'], ['2', 'A &gt; m', 'D = w', 'stack chips in <b>rows</b>; a decoder picks the row'], ['3', 'A = m', 'D &gt; w', 'put chips side by side in <b>columns</b>; each column gives w data bits'], ['4', 'A &gt; m', 'D &gt; w', 'both: 2<sup>n</sup> rows (n = A − m) and D / w columns']]) +
'<h3>3. Case 1: A = m, D = w</h3><p>Need 4 KB with an 8-bit bus, chips are 2<sup>12</sup> × 8. 4 KB = 2<sup>2</sup> × 2<sup>10</sup> × 2<sup>3</sup> = 2<sup>12</sup> × 8, so A = 12 = m and D = 8 = w: <b>one chip</b>. A11–A0 to its address pins, D7–D0 to its data pins, AS to CS, R/W* to OE, NOT R/W* to WE.</p>' +
'<h3>4. Case 2: more address lines (rows and a decoder)</h3><p>Need <b>16 KB</b> with an 8-bit bus, chips are 2<sup>12</sup> × 8 (4 KB). 16 KB = 2<sup>14</sup> × 8, so <b>A = 14 &gt; m = 12</b> and D = w. 2<sup>14</sup> × 8 = 4 × (2<sup>12</sup> × 8): <b>four chips</b>.</p>' +
K.list(['A11–A0 go to <b>every</b> chip.', 'The two extra lines, <b>A13–A12</b>, go into a <b>2-to-4 decoder</b>; each output drives one chip’s CS. AS enables the decoder.', 'R/W* goes to every OE, NOT R/W* to every WE; D7–D0 to every chip.']) + K.fig(sch(12, 8, 16, 8, 14), 'Case 2: four 2<sup>12</sup> × 8 chips in rows, chosen by A13–A12.') +
K.table(['A13 A12', 'Chip', 'Addresses'], [['00', 'Chip 1', '$0000 – $0FFF'], ['01', 'Chip 2', '$1000 – $1FFF'], ['10', 'Chip 3', '$2000 – $2FFF'], ['11', 'Chip 4', '$3000 – $3FFF']], 'mono') +
K.key('<p><b>Example:</b> address $1568 = %01 0101 0110 1000. A13–A12 = 01, so the decoder enables <b>chip 2</b>; A11–A0 = $568 selects the location inside it. The other chips have CS = 0 and stay silent.</p>') +
'<p>Each chip on its own sees addresses $000–$FFF; the processor sees one continuous space $0000–$3FFF.</p>' +
'<h3>5. Case 3: a wider data bus (columns)</h3><p>Need 16 KB with a <b>32-bit</b> bus, chips are 2<sup>12</sup> × 8. 16 KB = 2<sup>17</sup> bits = 2<sup>12</sup> × 32, so <b>A = 12 = m</b> and <b>D = 32 &gt; w = 8</b>: four chips <b>side by side</b>, one per byte of the bus (D31–D24, D23–D16, D15–D8, D7–D0). All four share A11–A0, CS, OE and WE, and are always used together.</p>' + K.fig(sch(12, 8, 16, 32, 12), 'Case 3: one row of four chips, each supplying 8 of the 32 data bits.') +
'<h3>6. Case 4: both</h3>' + K.form('A = m + n  →  n-to-2^n decoder and 2^n rows        D = w × k  →  D / w columns') +
'<p>n = 0 is case 1 or 3; one column is case 1 or 2. In general you need 2<sup>n</sup> × (D / w) chips. The <b>Memory System Design</b> practice tab designs any of these and draws the schematic.</p>' +
'<h3>7. Key points</h3>' + K.list(['Write the requirement as 2<sup>A</sup> × D and compare with 2<sup>m</sup> × w.', 'Extra address lines → rows + decoder on the top lines; wider bus → columns.', 'Low address lines go to every chip; AS enables the decoder; R/W* → OE, NOT R/W* → WE.']);
  }, w);

  /* ---------------- Lecture 12 ---------------- */
  Lectures.register('l12', function () {
    var C = window.CacheLogic;
    function bar(t, k, b, lab) { var g = function (n) { return 'flex-grow:' + (n + 3); }; return '<div class="lesson-cache"><div class="fmt"><div class="seg f-tag" style="' + g(t) + '"><b>' + t + '</b><span>Tag (T)</span></div><div class="seg f-idx" style="' + g(k) + '"><b>' + k + '</b><span>Set index (K)</span></div><div class="seg f-off" style="' + g(b) + '"><b>' + b + '</b><span>Block offset (B)</span></div></div>' + (lab ? '<p class="gcap center">' + lab + '</p>' : '') + '</div>'; }
    var p1 = C ? C.design({ bits: 30, cacheBytes: 4 * 1048576, line: 64, ways: 1 }) : null, p2 = C ? C.design({ bits: 28, cacheBytes: 1048576, line: 32, ways: 4 }) : null;
    var org = K.blocks(620, 200, [
      { id: 's0', x: 10, y: 10, w: 600, h: 44, label: 'Set 0:   [V | Tag | Data (2^B bytes)]   [V | Tag | Data]   …   A lines', cls: 'mem' },
      { id: 's1', x: 10, y: 64, w: 600, h: 44, label: 'Set 1:   [V | Tag | Data]   [V | Tag | Data]   …', cls: 'mem' },
      { id: 'sd', x: 10, y: 118, w: 600, h: 24, label: '⋮', cls: 'dim' },
      { id: 'sn', x: 10, y: 150, w: 600, h: 44, label: 'Set S−1:   [V | Tag | Data]   [V | Tag | Data]   …', cls: 'mem' }], [], 'Cache organization');
    return '' +
'<h3>1. Why a cache?</h3><p>Memory is large but slow compared with registers. A cache is a <b>small, fast memory between the processor and main memory</b> that keeps frequently used data close to the processor.</p>' +
K.table(['Level', 'Size', 'Latency (cycles)'], [['Registers', 'less than 8 KB', '1–2'], ['Cache (SRAM)', '64 KB – 1 MB', '4–10'], ['Main memory (DRAM)', 'gigabytes', '150–500'], ['Hard disk', 'terabytes', 'millions']]) +
'<p>The hierarchy gives the illusion of a memory as large as the cheapest technology and as fast as the fastest. (Like snacks by the couch: 5 seconds; the kitchen: 2 minutes; the store: 30 minutes.)</p>' +
'<h3>2. The array example</h3><p>Summing <code>a[0]…a[11]</code> (4-byte ints at 0x4000, 0x4004, …) with a 200-cycle memory takes 12 × 200 = <b>2400 cycles</b>. Now add a 4-cycle cache with <b>16-byte blocks</b> (4 elements per block). A miss brings the whole block in:</p>' +
K.table(['Access', 'Result', 'Cycles'], [['a[0]', 'miss: block 0x400 (a[0]–a[3]) loaded', '4 + 200'], ['a[1], a[2], a[3]', 'hits', '4 each'], ['a[4]', 'miss: block 0x401 loaded', '4 + 200'], ['a[5]–a[7]', 'hits', '4 each'], ['a[8]', 'miss: block 0x402', '4 + 200'], ['a[9]–a[11]', 'hits', '4 each'], ['<b>Total</b>', '3 misses, 9 hits', '<b>3 × 204 + 9 × 4 = 648</b>']]) +
'<p>The block number (the lecture calls it the block tag) is address ÷ block size: 0x4000 / 16 = 0x400.</p>' +
'<h3>3. Locality</h3>' + K.table(['Kind', 'Meaning', 'Example'], [['<b>Spatial</b>', 'after using an address, nearby addresses are likely next', 'array elements; instructions run in sequence'], ['<b>Temporal</b>', 'after using an address, the same address is likely again soon', 'the loop variable and sum; the loop’s instructions every iteration']]) +
'<h3>4. How a cache is organized</h3><p>A cache is an array of <b>S = 2<sup>K</sup> sets</b>; each set has <b>A lines</b>; each line has a <b>valid bit</b>, a <b>tag</b> and a <b>block of D = 2<sup>B</sup> bytes</b>.</p>' + K.fig(org) + K.form('cache size = S × A × D bytes') +
'<p>The main-memory byte address (T + K + B bits) is split into three fields:</p>' + bar(4, 2, 2, 'The lecture’s first example: 8-bit address, 4 sets, 2 lines per set, 4-byte blocks.') +
K.table(['Field', 'Answers'], [['Block offset (B bits)', 'which byte inside the block'], ['Set index (K bits)', 'which set the block can go in'], ['Tag (T bits)', 'which of the many blocks that share the set this is (compared with the stored tag)'], ['Tag + index together', 'the main-memory <b>block number</b>']]) +
'<h3>5. Mapping one address</h3><p>Memory of 256 bytes, 4-byte blocks → 64 blocks. <b>Byte 137</b> = 1000 10 01:</p>' +
K.table(['Field', 'Bits', 'Value'], [['Tag', '1000', '8'], ['Set index', '10', 'set 2'], ['Offset', '01', 'byte 1 of the block'], ['Block number {T,K}', '100010', '34 (bytes 136–139)']], 'mono') +
'<p>All blocks with the same index go to the same set (blocks 0, 4, 8, … 60 → set 0) and are told apart by their tag. 2<sup>T</sup> = 16 blocks compete for each set, and only A = 2 fit at a time.</p>' +
K.key('<p><b>Example 2:</b> 32 sets, 2 lines per set, 64-byte lines: cache = 32 × 2 × 64 = 4096 bytes = <b>4 KB</b>. Memory of 32 KB = 2<sup>15</sup> bytes → 15-bit address = T 4 | K 5 | B 6. Byte 20548 = 0x5044 = <span class="mono">1010 00001 000100</span>: tag 1010, <b>set 1</b>, byte 4 of <b>block 321</b> (20548 ÷ 64 = 321, and 321 mod 32 = 1).</p>') +
'<h3>6. Direct-mapped caches</h3><p>A <b>direct-mapped</b> cache has <b>one line per set</b> (A = 1): each memory block can go in exactly one place.</p>' + K.form('set = block address mod 2^K   (the low K bits of the block address)') +
'<p>Block 6 and block 14 both go to set 2 (6 mod 4 = 14 mod 4 = 2). On an access: use the index to pick the set; if the line is <b>valid</b> and its tag matches, it is a <b>hit</b>; otherwise it is a <b>miss</b>: fetch the block from memory, store its tag, set valid = 1. At start-up every valid bit is 0.</p>' + K.widget('cachesim') +
'<p>The lecture’s sequence 0 1 2 3 4 3 4 15 on a 4-block cache gives <b>6 misses</b>. The sequence 0 4 0 4… misses <b>every time</b>: blocks 0 and 4 share set 0 and keep evicting each other (<b>conflict misses</b>, the ping-pong effect). Associativity (several lines per set) fixes this.</p>' +
'<h3>7. Worked problems</h3>' +
(p1 ? K.key('<p><b>1 GB byte-addressable memory, 4 MB direct-mapped cache, 64-byte lines.</b></p>' + K.list(['1 GB = 2<sup>30</sup> bytes → <b>30-bit</b> address.', 'Memory blocks = 2<sup>30</sup> / 2<sup>6</sup> = 2<sup>24</sup> = 16,777,216.', 'Cache lines = 4 MB / 64 B = 2<sup>22</sup> / 2<sup>6</sup> = 2<sup>16</sup> = 65,536.', 'B = log<sub>2</sub>64 = 6; sets = lines / 1 = 2<sup>16</sup> → K = 16; T = 30 − 16 − 6 = <b>8</b>.']) + bar(p1.tag, p1.index, p1.offset)) : '') +
(p2 ? K.key('<p><b>256 MB memory, 1 MB 4-way set-associative cache, 32-byte lines.</b></p>' + K.list(['256 MB = 2<sup>28</sup> bytes → <b>28-bit</b> address; 2<sup>28</sup> / 2<sup>5</sup> = 2<sup>23</sup> blocks.', 'Lines = 1 MB / 32 B = 2<sup>15</sup> = 32,768; sets = 2<sup>15</sup> / 4 = 2<sup>13</sup> = 8,192.', 'B = 5, K = 13, T = 28 − 13 − 5 = <b>10</b>.']) + bar(p2.tag, p2.index, p2.offset)) : '') +
'<h3>8. Key points</h3>' + K.list(['A cache keeps copies of frequently used blocks; whole blocks move on a miss.', 'It works because of spatial and temporal locality.', 'Size = S × A × D; address = tag | index | offset.', 'Direct-mapped is simplest but suffers conflict misses; more ways reduce them.']);
  }, w);

  /* ---------------- Lecture 13 ---------------- */
  Lectures.register('l13', function () {
    var D = window.IODraw, L = window.IOLogic;
    var rw = (function () {
      var X0 = 90, U = 46, b = '', sig = function (y, d) { return '<path d="' + d + '" class="lk-w a" fill="none"/>'; };
      function lab(y, t) { return '<text x="' + (X0 - 10) + '" y="' + y + '" text-anchor="end" dominant-baseline="central" class="lk-bt">' + t + '</text>'; }
      b += lab(25, "rd'/wr") + sig(25, 'M' + X0 + ' 15H' + (X0 + U * 0.6) + 'V35H' + (X0 + U * 7) );
      b += lab(70, 'enable') + sig(70, 'M' + X0 + ' 80H' + (X0 + U * 2) + 'V60H' + (X0 + U * 5) + 'V80H' + (X0 + U * 7));
      b += lab(115, 'addr') + '<path d="M' + X0 + ' 115H' + (X0 + U) + 'M' + (X0 + U * 5.5) + ' 115H' + (X0 + U * 7) + '" class="lk-w" fill="none"/><path d="M' + (X0 + U) + ' 115L' + (X0 + U + 6) + ' 105H' + (X0 + U * 5.5 - 6) + 'L' + (X0 + U * 5.5) + ' 115L' + (X0 + U * 5.5 - 6) + ' 125H' + (X0 + U + 6) + 'Z" class="lk-b mem"/><text x="' + (X0 + U * 3.2) + '" y="115" text-anchor="middle" dominant-baseline="central" class="lk-bs">address valid</text>';
      b += lab(160, 'data') + '<path d="M' + (X0 + U * 3.5) + ' 160L' + (X0 + U * 3.5 + 6) + ' 150H' + (X0 + U * 5.2 - 6) + 'L' + (X0 + U * 5.2) + ' 160L' + (X0 + U * 5.2 - 6) + ' 170H' + (X0 + U * 3.5 + 6) + 'Z" class="lk-b acc"/><text x="' + (X0 + U * 4.35) + '" y="160" text-anchor="middle" dominant-baseline="central" class="lk-bs">data</text>';
      b += '<path d="M' + (X0 + U) + ' 190H' + (X0 + U * 2) + '" class="lk-w" marker-end="url(#lk-ar)" marker-start="url(#lk-ar)"/><text x="' + (X0 + U * 1.5) + '" y="206" text-anchor="middle" class="lk-bs">t<tspan dy="3" font-size="9">setup</tspan></text>';
      b += '<path d="M' + (X0 + U * 2) + ' 215H' + (X0 + U * 3.5) + '" class="lk-w" marker-end="url(#lk-ar)" marker-start="url(#lk-ar)"/><text x="' + (X0 + U * 2.75) + '" y="231" text-anchor="middle" class="lk-bs">t<tspan dy="3" font-size="9">read</tspan></text>';
      return '<svg class="lk-svg" viewBox="0 0 440 242" width="100%" style="max-width:440px" role="img" aria-label="Read protocol timing"><defs><marker id="lk-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1L9 5L1 9z" class="lk-ah"/></marker></defs>' + b + '</svg>';
    })();
    return '' +
'<h3>1. External devices</h3><p>A peripheral is an external device connected to the computer through an <b>I/O module</b>; the link carries control, status and data. Three categories:</p>' + K.table(['Category', 'For', 'Examples'], [['Human readable', 'communicating with the user', 'displays, printers'], ['Machine readable', 'communicating with equipment', 'disks, tape, sensors, actuators'], ['Communication', 'remote devices', 'terminals, other computers']]) +
'<p><b>Keyboard and monitor</b> exchange characters. Each has a 7-bit code in the <b>International Reference Alphabet</b> (IRA, i.e. ASCII): 128 characters, either printable (letters, digits, symbols) or control (carriage return, communication codes). A key press becomes an electrical signal that the keyboard’s transducer turns into the IRA bit pattern.</p>' +
'<h3>2. Pulse width modulation (PWM)</h3><p>A PWM generates pulses with chosen high and low times. The <b>duty cycle</b> is the percentage of time the signal is high; a square wave is 50%. A device such as a DC motor or a lamp responds to the <b>average voltage</b>: with 5 V, 25% gives 1.25 V, 50% gives 2.5 V, 75% gives 3.75 V. Simpler than a DC-DC converter or a DAC.</p>' + K.widget('pwm') +
'<p>Inside: a counter (0–254) driven by a divided clock is compared with a register <code>cycle_high</code>: output = 1 while counter &lt; cycle_high, else 0. The program just writes the period and duty registers (e.g. <code>PWMP = 0xFF; PWM1 = 0x7F;</code> ≈ 50%). A transistor driver supplies the motor’s current.</p>' +
'<h3>3. Buses, ports and timing diagrams</h3><p>A <b>bus</b> is a set of wires with one function (address bus, data bus), or the whole collection of address, data and control wires, together with a <b>protocol</b> (the rules). A <b>port</b> is the conducting device (pin, pad) where a bus connects to a chip.</p>' +
'<p>A <b>timing diagram</b> shows a protocol, time going right. A control signal is high or low (it may be active low, e.g. go’); a data signal is valid or not. Reading memory: rd’/wr is set low (read), the address is placed for at least <b>t<sub>setup</sub></b> before enable is asserted, and the memory puts data on the bus within <b>t<sub>read</sub></b>.</p>' + K.fig(rw, 'A read bus cycle.') +
'<h3>4. Protocol concepts</h3>' + K.list(['<b>Actors</b>: the <b>master</b> starts a transfer; the <b>servant</b> (slave) responds.', '<b>Direction</b>: sender and receiver.', '<b>Addresses</b>: a special kind of data naming a memory location, a peripheral, or a register in it.', '<b>Time multiplexing</b>: share one set of wires for several pieces of data, saving wires at the cost of time.']) +
(D ? iod(K.fig(D.serialBus(16, 8, L.serialize(16, 8)), '<b>Data serialization</b>: 16 bits over an 8-bit bus in two transfers, high byte first.') + K.fig(D.addrBus(16, 8, L.addrData(16, 8)), '<b>Address/data multiplexing</b>: the address goes first on the shared lines, then the data.')) : '') +
'<h3>5. Strobe and handshake</h3>' + (D ? iod('<div class="gtwo">' + K.fig(D.timing('strobe', 2, 3), '<b>Strobe</b>: master asserts req; the servant must put data on the bus within t<sub>access</sub>; master reads and deasserts req.') + K.fig(D.timing('handshake', 4, 3), '<b>Handshake</b>: the servant takes as long as it needs and asserts <b>ack</b> when the data is valid.') + '</div>') : '') +
'<p><b>Compromise (strobe/handshake with a wait line):</b> a fast servant answers within t<sub>access</sub> and the wait line is never used (like a strobe). A slow servant asserts <b>wait</b>, puts the data on the bus, then deasserts wait; the master reads when wait drops (like a handshake). Fast in the common case, safe in the slow one.</p>' +
'<p><b>Example, the ISA bus</b> (80x86): 20-bit address, 8-bit data, a memory-read or memory-write bus cycle of 4 clock cycles (C1–C4) with ALE latching the address, unless the device deasserts <b>CHRDY</b>, which adds wait cycles (up to 6).</p>' +
'<h3>6. I/O addressing</h3>' + K.table(['Method', 'How'], [['Port-based I/O (parallel I/O)', 'the processor has N-bit ports that software reads and writes like registers: <code>P0 = 0xFF; v = P1.2;</code>'], ['Bus-based I/O', 'address, data and control ports form one bus; one instruction carries out the whole read or write protocol']]) +
'<p>Bus-based I/O talks to memory and peripherals over the same bus, in one of two ways:</p>' + K.table(['', 'Memory-mapped I/O', 'Standard (I/O-mapped) I/O'], [['Idea', 'peripheral registers take addresses in the same address space as memory (e.g. lower 32K = memory, upper 32K = peripherals)', 'an extra M/IO pin says whether an access is for memory or a peripheral: all 64K addresses for each'], ['Instructions', 'no special ones: MOV, ADD… work on peripherals too', 'needs special ones (IN, OUT)'], ['Advantage', 'simpler programming', 'no memory addresses lost to peripherals; simpler, faster address decoding']]) +
'<p><b>8051 external memory:</b> port P0 carries the low address byte and then the data (time-multiplexed). The <b>ALE</b> signal latches the address byte into a 74373 latch so the address stays valid while P0 switches to data.</p>' +
'<h3>7. Error detection</h3><p>A single <b>bit error</b> inverts one bit; a <b>burst</b> corrupts several consecutive bits. <b>Detection</b> lets the receiver notice; <b>correction</b> usually means acknowledge-and-retransmit.</p>' +
K.list(['<b>Parity</b>: one extra bit per word. Odd parity: the word plus parity bit has an odd number of 1s; even parity: an even number. Detects every single-bit error (any odd number of errors), but not all bursts.', 'Parity can be computed per row and per column of a block of data.', '<b>Checksum</b>: an extra word per packet, e.g. the XOR of all the data words.']) +
'<p>Example (odd parity): 10011 received as 10001 is detected (one flip), but received as 10101 it is not (two flips).</p>' +
'<h3>8. Odd and even functions, parity circuits</h3>' + '<div class="gtwo">' + K.table(['x y z', 'f<sub>odd</sub>'], [['000', '0'], ['001', '1'], ['010', '1'], ['011', '0'], ['100', '1'], ['101', '0'], ['110', '0'], ['111', '1']], 'mono') +
'<div><p>The <b>odd function</b> is 1 when an odd number of inputs are 1: it is the <b>XOR</b> of all inputs (two XOR gates for 3 inputs). The <b>even function</b> is its complement, <b>XNOR</b>.</p>' + K.table(['Parity', 'Generate with', 'Check with'], [['Even', 'odd function (XOR)', 'odd function: 1 = error'], ['Odd', 'even function (XNOR)', 'even function']]) + '</div></div>' +
(D ? iod(K.fig(D.par3(1, 0, 1, 1, 0, 1, 1), 'Even parity for 3 bits: P = x ⊕ y ⊕ z; checker E = P ⊕ x ⊕ y ⊕ z. Here P should be 0 but arrived as 1, so E = 1.')) : '') +
'<h3>9. Hierarchical design</h3><p>To simplify a complex circuit, split it into <b>blocks</b>, split those into smaller blocks, and repeat until each block is simple (a <b>primitive</b>). The result is a tree of blocks.</p>' + (D ? iod(K.fig(D.par16(0xA5F0), 'A 16-input odd function from five 4-input odd functions; each 4-input one is three XOR gates.')) : '') +
'<h3>10. Key points</h3>' + K.list(['PWM controls an average voltage through its duty cycle.', 'Protocols: master/servant; strobe (fixed time), handshake (ack), or the wait-line compromise.', 'Memory-mapped I/O uses ordinary instructions; standard I/O needs IN/OUT but keeps the whole address space.', 'Even parity = XOR; it catches any odd number of bit errors.']);
  }, w);

  /* ---------------- Lecture 14 ---------------- */
  Lectures.register('l14', function () {
    var D = window.IODraw, Q = window.IOQuestions, L = window.IOLogic;
    var flynn = K.blocks(640, 150, [
      { id: 'a', x: 10, y: 10, w: 145, h: 60, label: 'SISD', sub: '1 instruction, 1 data', cls: 'acc' }, { id: 'b', x: 170, y: 10, w: 145, h: 60, label: 'SIMD', sub: '1 instruction, many data', cls: 'acc' },
      { id: 'c', x: 330, y: 10, w: 145, h: 60, label: 'MISD', sub: 'many instr., 1 data', cls: 'dim' }, { id: 'd', x: 490, y: 10, w: 145, h: 60, label: 'MIMD', sub: 'many instr., many data', cls: 'acc' },
      { id: 'a2', x: 10, y: 85, w: 145, h: 55, label: 'uniprocessor', cls: 'mem' }, { id: 'b2', x: 170, y: 85, w: 145, h: 55, label: 'vector / array', sub: 'processors', cls: 'mem' },
      { id: 'c2', x: 330, y: 85, w: 145, h: 55, label: 'not built', sub: 'commercially', cls: 'dim' }, { id: 'd2', x: 490, y: 85, w: 145, h: 55, label: 'SMP, clusters,', sub: 'NUMA', cls: 'mem' }], [['a', 'a2'], ['b', 'b2'], ['c', 'c2'], ['d', 'd2']], 'Flynn’s taxonomy');
    var mc = function (title, x, cfg) {
      var b = '<text x="' + (x + 70) + '" y="12" text-anchor="middle" class="lk-bs">' + title + '</text>';
      [0, 1].forEach(function (c) {
        var cx = x + 4 + c * 72;
        b += '<rect x="' + cx + '" y="20" width="64" height="26" rx="5" class="lk-b acc"/><text x="' + (cx + 32) + '" y="33" text-anchor="middle" dominant-baseline="central" class="lk-bs">Core ' + (c ? 'n' : '1') + '</text>';
        b += '<rect x="' + cx + '" y="50" width="64" height="18" rx="4" class="lk-b mem"/><text x="' + (cx + 32) + '" y="59" text-anchor="middle" dominant-baseline="central" class="lk-bs">L1 I + D</text>';
        if (cfg.l2priv) b += '<rect x="' + cx + '" y="72" width="64" height="18" rx="4" class="lk-b mem"/><text x="' + (cx + 32) + '" y="81" text-anchor="middle" dominant-baseline="central" class="lk-bs">L2</text>';
      });
      if (cfg.shared) b += '<rect x="' + (x + 4) + '" y="' + (cfg.l2priv ? 94 : 72) + '" width="136" height="18" rx="4" class="lk-b io"/><text x="' + (x + 72) + '" y="' + (cfg.l2priv ? 103 : 81) + '" text-anchor="middle" dominant-baseline="central" class="lk-bs">shared ' + cfg.shared + '</text>';
      var my = cfg.shared && cfg.l2priv ? 118 : cfg.shared || cfg.l2priv ? 96 : 74;
      b += '<rect x="' + (x + 4) + '" y="' + my + '" width="136" height="18" rx="4" class="lk-b dim"/><text x="' + (x + 72) + '" y="' + (my + 9) + '" text-anchor="middle" dominant-baseline="central" class="lk-bs">main memory</text>';
      return b;
    };
    var orgs = '<svg class="lk-svg" viewBox="0 0 620 142" width="100%" style="max-width:620px" role="img" aria-label="Multicore organizations">' + mc('(a) dedicated L1', 0, {}) + mc('(b) dedicated L2', 155, { l2priv: 1 }) + mc('(c) shared L2', 310, { shared: 'L2' }) + mc('(d) shared L3', 465, { l2priv: 1, shared: 'L3' }) + '</svg>';
    var tl = (function () {
      var b = '', row = function (y, segs) { segs.forEach(function (s) { b += '<rect x="' + (90 + s[0] * 9) + '" y="' + y + '" width="' + (s[1] * 9) + '" height="14" rx="2" class="lk-b ' + (s[2] ? 'acc' : 'dim') + '"/>'; }); };
      b += '<text x="0" y="12" class="lk-bs">(a) one processor: interleaved</text>';
      [['P1', [[0, 6, 1], [6, 8, 0], [14, 6, 1], [20, 10, 0], [30, 6, 1]]], ['P2', [[0, 6, 0], [6, 6, 1], [12, 10, 0], [22, 6, 1]]], ['P3', [[0, 12, 0], [12, 4, 1], [16, 12, 0], [28, 2, 1]]]].forEach(function (p, i) { b += '<text x="80" y="' + (30 + i * 20) + '" text-anchor="end" class="lk-bs">' + p[0] + '</text>'; row(20 + i * 20, p[1]); });
      b += '<text x="0" y="102" class="lk-bs">(b) two processors: interleaved and overlapped</text>';
      [['P1', [[0, 6, 1], [6, 4, 0], [10, 8, 1], [18, 6, 0], [24, 6, 1]]], ['P2', [[0, 8, 1], [8, 6, 0], [14, 8, 1]]], ['P3', [[0, 6, 0], [6, 8, 1], [14, 6, 0], [20, 6, 1]]]].forEach(function (p, i) { b += '<text x="80" y="' + (120 + i * 20) + '" text-anchor="end" class="lk-bs">' + p[0] + '</text>'; row(110 + i * 20, p[1]); });
      b += '<rect x="420" y="10" width="14" height="10" class="lk-b acc"/><text x="440" y="18" class="lk-bs">running</text><rect x="500" y="10" width="14" height="10" class="lk-b dim"/><text x="520" y="18" class="lk-bs">blocked</text>';
      return '<svg class="lk-svg" viewBox="0 0 600 175" width="100%" style="max-width:600px" role="img" aria-label="Multiprogramming and multiprocessing">' + b + '</svg>';
    })();
    var G = Q ? Q.GRAPH : null, cp = G ? L.criticalPath(G) : null, two = G ? L.schedule(G, 2) : null;
    return '' +
'<h3>1. Flynn’s taxonomy</h3><p>Computers are classified by how many <b>instruction streams</b> and <b>data streams</b> they process at once:</p>' + K.fig(flynn) +
K.table(['Class', 'Meaning'], [['SISD', 'one processor executes one instruction stream on data in one memory'], ['SIMD', 'one instruction controls many processing elements in lockstep, each on its own data (vector and array processors, GPUs)'], ['MISD', 'one data stream through processors each running different instructions; not commercially built'], ['MIMD', 'many processors run different instruction streams on different data (SMPs, clusters, NUMA)']]) +
'<p>Example: <code>Sum = a[0] + … + a[99]</code> and <code>Mult = b[0] × … × b[99]</code>. SIMD would apply one operation to many elements at once; MIMD could run the sum and the product as two independent programs on two processors.</p>' +
'<h3>2. Symmetric multiprocessors (SMP)</h3><p>A stand-alone computer with:</p>' + K.list(['two or more similar processors of comparable capacity;', 'shared main memory and I/O, connected by a bus or other interconnection, with roughly the same memory access time for every processor;', 'shared access to I/O devices (same or different channels);', 'all processors able to perform the same functions (hence "symmetric");', 'one integrated operating system managing the processors, jobs, tasks and files.']) +
'<p>Multiprogramming interleaves processes on one processor; multiprocessing also overlaps them in time:</p>' + K.fig(tl) +
'<h3>3. The shared bus</h3>' + K.table(['Advantages', 'Disadvantages'], [['<b>Simplicity</b>: the simplest multiprocessor organization<br><b>Flexibility</b>: easy to add processors to the bus<br><b>Reliability</b>: the bus is passive, so one failed device does not bring down the system', '<b>Performance</b>: every memory reference crosses the bus, limited by the bus cycle time<br>So each processor gets a <b>cache</b>, which reduces bus traffic but creates the <b>cache coherence</b> problem: if one cache changes a word, copies in other caches become stale. Other processors must be told; this is usually done in hardware.']]) +
'<h3>4. Operating system issues</h3>' + K.table(['Issue', 'What the OS must do'], [['Simultaneous processes', 'reentrant OS code so several processors can run it; manage tables to avoid deadlock'], ['Scheduling', 'any processor may schedule, so avoid conflicts; assign ready processes to available processors'], ['Synchronization', 'enforce mutual exclusion and event ordering on shared memory and I/O'], ['Memory management', 'exploit the parallel hardware; coordinate paging across processors'], ['Reliability and fault tolerance', 'degrade gracefully when a processor fails; restructure the schedule']]) +
'<h3>5. Multicore organizations</h3><p>A multicore chip puts several processors (cores) on one die. They differ in how many cache levels each core keeps for itself:</p>' + K.fig(orgs, 'Caches closer to the core are smaller and faster; shared caches let cores share data without going to main memory.') +
'<h3>6. Heterogeneous multicore</h3><p>A chip with <b>more than one kind of core</b>, most often CPUs plus <b>GPUs</b>. GPUs run thousands of parallel threads, so they suit large amounts of vector and matrix data; CPUs are best at serial work. <b>Heterogeneous System Architecture (HSA)</b> makes them work together:</p>' +
K.list(['the whole virtual memory space is visible to both CPU and GPU;', 'virtual memory brings pages into physical memory as needed;', 'a coherent memory policy keeps CPU and GPU caches up to date;', 'one programming interface lets programs use both seamlessly.']) +
'<h3>7. Scheduling a task graph</h3><p>A program split into tasks with dependencies is a <b>task graph</b>; assigning its tasks to processors is the scheduler’s job.</p>' +
(G && D ? iod(K.fig(D.taskGraph(G, cp.path), 'The practice problem’s graph; the critical path is highlighted.') + K.fig(D.gantt(two.cores, two.time, ['Core 1', 'Core 2'], cp.path), 'The best two-core schedule: ' + two.time + ' time units against 18 on one core, a speedup of ' + (18 / two.time).toFixed(1) + '.')) : '') +
K.list(['One core: the sum of all task times.', 'n cores: at least the critical path, and at least total work ÷ n.', 'Speedup = one-core time ÷ n-core time.']) +
'<h3>8. Key points</h3>' + K.list(['Flynn: SISD, SIMD, MISD, MIMD.', 'SMP: similar processors sharing memory and I/O under one OS.', 'Shared buses are simple but limit performance; caches help but need coherence.', 'Multicore chips differ in which caches are private or shared; heterogeneous chips mix CPUs and GPUs.']);
  }, w);

  /* ---------------- Lecture 15 ---------------- */
  Lectures.register('l15', function () {
    var D = window.IODraw, L = window.IOLogic, Q = window.IOQuestions;
    var tab = L ? K.table(['S4', 'S3', 'S2', 'S1', 'S0', 'Cin', 'Operation'], L.TABLE.map(function (r, i) { return r.slice(0, 5).map(String).concat([r[5] === null ? 'X' : String(r[5]), '<b>' + K.esc(L.TABLE_OPS[i]) + '</b>']); }), 'mono') : '';
    var hs = K.blocks(620, 260, [
      { id: 'a', x: 20, y: 10, w: 60, h: 30, label: 'A' }, { id: 'b', x: 200, y: 10, w: 60, h: 30, label: 'B' },
      { id: 'inv', x: 230, y: 55, w: 90, h: 30, label: 'NOT / mux', sub: 'F2: B or ~B', cls: 'acc' },
      { id: 'add', x: 120, y: 110, w: 90, h: 40, label: '+', sub: 'Cin = F2', cls: 'acc' }, { id: 'and', x: 250, y: 110, w: 70, h: 40, label: 'AND' }, { id: 'or', x: 340, y: 110, w: 70, h: 40, label: 'OR' },
      { id: 'zx', x: 20, y: 170, w: 120, h: 36, label: 'zero-extend', sub: 'sign bit S[N−1]', cls: 'dim' },
      { id: 'mux', x: 160, y: 210, w: 260, h: 40, label: 'mux (F1:0)', sub: '0 AND, 1 OR, 2 sum, 3 SLT', cls: 'acc' }
    ], [['b', 'inv'], ['a', 'add', '', 'M50 40V130H118'], ['inv', 'add', 'BB', 'M275 85V95H165V108'], ['inv', 'and', '', 'M285 85V108'], ['inv', 'or', '', 'M300 85V95H375V108'], ['add', 'zx', '', 'M140 150V160H80V168'], ['add', 'mux', 'S', 'M175 150V208'], ['and', 'mux', '', 'M285 150V208'], ['or', 'mux', '', 'M375 150V208'], ['zx', 'mux', '', 'M80 206V230H158']], 'The textbook ALU');
    return '' +
'<h3>1. What an ALU is</h3><p>An <b>arithmetic logic unit</b> combines many arithmetic and logic operations in one unit, which performs <b>one function at a time</b>, chosen by control inputs. It is drawn as a V-shaped block with inputs A and B (N bits each), a control input F, and output Y.</p>' +
'<h3>2. The textbook ALU (F<sub>2:0</sub>)</h3>' + K.table(['F<sub>2:0</sub>', 'Function'], [['000', 'A AND B'], ['001', 'A OR B'], ['010', 'A + B'], ['011', 'not used'], ['100', 'A AND ~B'], ['101', 'A OR ~B'], ['110', 'A − B'], ['111', 'SLT (set if A &lt; B)']], 'mono') +
K.fig(hs, 'F2 chooses B or ~B (called BB) and is also the adder’s carry-in; F1:0 choose which result reaches Y.') +
K.list(['<b>F2</b> drives a mux that passes B or ~B, and the same F2 is the carry-in. So F = 110 computes A + ~B + 1 = <b>A − B</b> (two’s complement).', 'The AND and OR gates and the adder all work at once on A and BB.', '<b>F1:0</b> drive the output mux: 00 AND, 01 OR, 10 the sum, 11 SLT.', '<b>SLT</b> (set less than): compute S = A − B; if its sign bit S<sub>N−1</sub> is 1 the result is negative, so A &lt; B. The sign bit is zero-extended to N bits: Y = 1 if A &lt; B, else 0.', 'With F2 = 1, F1:0 = 00 and 01 give A AND ~B and A OR ~B for free.']) +
'<p>Try every function on 4-bit values:</p>' + K.widget('harris') +
'<h3>3. Another ALU design (five select bits)</h3><p>The practice problem uses a bigger ALU with select bits S4–S0 and Cin:</p>' + tab +
K.list(['<b>One adder</b> computes A + X + Cin, where a mux driven by S1 S0 chooses X: 0, B, ~B, or 0. That covers every arithmetic row: A, A + 1, A + B, A + B + 1, A + ~B, A + ~B + 1 (= A − B).', 'A <b>logic unit</b> computes AND, OR, XOR and ~A; a mux driven by S1 S0 picks one.', '<b>S2</b> chooses the adder (0) or the logic unit (1).', '<b>S4 S3</b> choose the final output: that result (00), A &lt;&lt; 1 (01), A &gt;&gt; 1 (10) or 0 (11).']) +
(D && L && Q ? iod(K.fig(D.aluPath(L.alu(0x3C, 0x0F, 0b00010, 1), 0x3C, 0x0F, 1, Q.hex2), 'Select 00010 with Cin = 1: A + ~B + 1 = A − B; with A = 0x3C and B = 0x0F the result is 0x2D.')) : '') +
'<p>The <b>ALU &amp; Parity</b> practice tab lets you flip every select bit of this design and see the path light up.</p>' +
'<h3>4. Key points</h3>' + K.list(['An ALU does one operation at a time, chosen by its control bits.', 'Subtraction = A + ~B + 1: invert B and set the carry-in.', 'SLT uses the sign of A − B.', 'Sharing one adder and selecting with muxes keeps the design small.']);
  }, w);
})();
