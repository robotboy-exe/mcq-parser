# Android RAM and Swap Investigation

**Session ID:** ses_e35a6c82dfferyYZp6nVUzrAQL
**Created:** 11/11/2026, 12:23:27 PM
**Updated:** 11/11/2026, 12:47:28 PM

---

## User

Task: Investigate Android RAM and Swap Consumption

Perform a read-only investigation of memory usage on this Samsung Galaxy A15 4G (4GB RAM, Helio G99, Android 14) through the available Termux environment.

Initial observations

Output from "/proc/meminfo":

MemTotal:        3726076 kB
MemFree:           41936 kB
MemAvailable:     750744 kB
Buffers:            1116 kB
Cached:           728052 kB
SwapTotal:       3145724 kB
SwapFree:         166688 kB
Slab:             447912 kB
SReclaimable:     138756 kB
AnonPages:        874632 kB
Mapped:           388140 kB
Shmem:             25808 kB

Notable observations:

- Approximately 3.64 GiB RAM visible to Linux.
- Only approximately 733 MiB reported as available.
- Approximately 2.91 GiB of swap is occupied.
- Kernel slab allocation is approximately 437 MiB.
- Reclaimable slab is approximately 136 MiB.

Investigation objectives

Determine where physical RAM is going, what is occupying swap, and whether any unusual memory consumption exists.

1. System memory accounting

Inspect:

- "/proc/meminfo"
- "/proc/vmstat"
- "/proc/pressure/memory"
- "/proc/swaps"
- "/proc/zoneinfo" where accessible.

Explain the significance of the findings, especially anonymous memory, file cache, kernel memory, unreclaimable memory and swap usage.

2. Kernel memory

Investigate:

- "/proc/slabinfo"
- Individual slab cache sizes and object counts.
- Major kernel memory consumers.
- Whether large allocations are reclaimable or unreclaimable.

Identify unusually large allocations rather than merely listing them.

3. Process memory

Identify accessible processes and rank them by memory consumption.

Where permissions allow, inspect:

- RSS
- PSS
- Anonymous memory
- Shared memory
- Swap usage per process
- "/proc/PID/status"
- "/proc/PID/smaps_rollup"

Distinguish actual physical memory consumption from shared mappings and virtual address space.

4. Android-specific memory consumers

Investigate the contribution of:

- Android framework and system services.
- System UI and One UI.
- Google Play services.
- ART and Zygote.
- Hardware drivers and GPU allocations.
- Android graphics buffers.
- Vendor-specific background services.

Use available Android interfaces such as "dumpsys meminfo", "dumpsys activity processes", and other relevant read-only ADB/shell interfaces where accessible.

Clearly identify permission restrictions. Do not interpret inaccessible information as zero consumption.

5. Swap and zRAM

Determine:

- Whether swap is backed by zRAM.
- Configured zRAM capacity and actual compressed data size.
- Compression algorithm.
- Compression ratio, where measurable.
- Whether swap usage indicates current memory pressure or accumulated inactive pages.
- Whether zRAM is contributing to performance degradation.

Inspect relevant "/sys/block/zram*" interfaces where accessible.

6. Findings and recommendations

Provide:

1. Executive summary.
2. Physical RAM breakdown.
3. Largest identifiable memory consumers.
4. Kernel/slab analysis.
5. Swap/zRAM analysis.
6. Unexplained or inaccessible memory.
7. Potential performance implications.
8. Evidence-based recommendations ranked by expected benefit and risk.

Explicitly distinguish measured values, estimates and unknowns.

Execution constraints

- READ-ONLY investigation. Do not modify system settings.
- Do not kill processes, clear caches, disable services, alter zRAM, change swap configuration or install packages.
- Do not root the device or attempt to bypass Android security restrictions.
- Do not assume Termux has access to the entire Android process namespace.
- Record failed commands and permission-denied responses.
- Prefer existing tools and interfaces.
- Do not mistake low "MemFree" for memory exhaustion.
- Do not mistake cached memory for wasted memory.
- Do not add process RSS values together and present the result as unique physical RAM consumption.
- Do not make recommendations until the evidence has been collected.

Deliverable

Produce a structured investigation report with:

- Exact commands executed.
- Raw measurements and converted MiB/GiB values.
- Interpretation of each significant finding.
- Limitations imposed by Android permissions.
- Clear separation between confirmed findings and hypotheses.

The goal is to explain what is consuming RAM on this device, including memory that ordinary application managers do not expose. 

---

## Assistant

I’ll establish a timestamped system baseline, then inspect kernel accounting, zRAM, accessible processes, and Android service interfaces without changing state. Permission failures will be retained as evidence rather than treated as zero usage.

**Tool: todowrite**

---

## Assistant

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

---

## Assistant

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

---

## Assistant

The baseline confirms an untrusted-app SELinux context, and Android denies every requested global `/proc` interface except `/proc/meminfo`; even `/proc/uptime` is blocked. I’ll now separate what remains measurable through sysfs and same-UID `/proc` from Binder interfaces that require Android’s privileged `DUMP` permission.

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

---

## Assistant

**Tool: glob**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

---

## Assistant

**Tool: bash**

---

## Assistant

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

---

## Assistant

A controlled 15.5-second sample caught active zRAM churn: logical swap grew by about 205 MiB while roughly 169 MiB was read and 527 MiB written through zRAM, ending 99.96% logically full. The visible Termux UID alone includes a 251 MiB-PSS `opencode` process with 542 MiB swapped, so I’m quantifying all same-UID processes before attributing the remaining system-wide load.

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

---

## Assistant

**Tool: bash**

---

## Assistant

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

---

## Assistant

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

---

## Assistant

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

---

## Assistant

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

---

## Assistant

The major kernel totals are visible, but cache-level slab attribution is blocked: `/proc/slabinfo`, `/sys/kernel/slab`, and `/proc/vmallocinfo` are all denied. Android likewise hides every non-Termux PID and rejects ActivityManager, procstats, SurfaceFlinger, graphics, and GPU dumps; therefore framework, One UI, Play services, Zygote, and vendor per-process values remain unknown rather than zero.

**Tool: bash**

---

## Assistant

**Tool: bash**

---

## Assistant

**Tool: todowrite**

---

## Assistant

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

**Tool: bash**

---

## Assistant

**Tool: bash**

---

## Assistant

**Tool: todowrite**

---

## Assistant

**Executive Summary**
- `MemTotal` is **3,638.75 MiB (3.553 GiB)**, not 3.64 GiB. The boot property reports `4096MB`, leaving approximately **457.25 MiB outside Linux `MemTotal`** for firmware, secure memory, fixed carve-outs, and other reserved pages.
- The final snapshot had **512.76 MiB available** despite only **82.29 MiB free**. Low `MemFree` alone does not indicate exhaustion.
- Swap is effectively confirmed as a single **3 GiB zRAM device** using **LZ4**. Its swap size differs from `zram0` capacity by exactly one 4 KiB swap-header page.
- Logical swap varied between **2.79 and 3.07 GiB used**, reaching **99.96% full** during one sample.
- At the final snapshot, zRAM held **2,786.46 MiB uncompressed** in **838.06 MiB physical RAM**, an effective **3.32:1** ratio.
- zRAM was actively churning, not merely retaining old inactive pages. Even a quieter 20-second interval read **66.77 MiB** and wrote **58.97 MiB**.
- Kernel structures are substantial: **433.80 MiB slab**, **119.21 MiB page tables**, and **97.15 MiB kernel plus shadow stacks**.
- The visible Termux UID accounted for **221.26 MiB resident PSS** and **731.82 MiB SwapPSS**. `opencode` alone represented approximately **817.79 MiB resident-plus-swapped logical footprint**.
- Android hides all other UIDs and denies privileged memory dumps. Roughly **2.1 to 2.3 GiB of logical swap remains unattributed**, mostly anonymous memory belonging to inaccessible Android processes.
- This is a genuinely memory-pressured, high-churn state, but it does not prove a kernel leak or rogue system app.

**Physical RAM**
Snapshot: `2026-11-11T12:38:55+01:00`. Linux `kB` values are KiB.

| Category | Raw | MiB | Interpretation |
|---|---:|---:|---|
| Anonymous resident | 1,166,640 kB | 1,139.30 | Process heaps/stacks and private mappings currently in RAM |
| File cache excluding shmem | 433,704 kB | 423.54 | Derived as `Cached - Shmem`; normally reclaimable |
| Shared memory | 16,440 kB | 16.05 | tmpfs/shared-memory pages |
| Buffers | 928 kB | 0.91 | Small block metadata cache |
| Slab | 444,208 kB | 433.80 | Kernel object caches |
| Kernel stacks | 79,552 kB | 77.69 | Per-thread kernel stacks |
| Shadow call stacks | 19,928 kB | 19.46 | ARM64 control-flow protection stacks |
| Page tables | 122,076 kB | 119.21 | Mapping overhead for all processes |
| Per-CPU allocations | 11,200 kB | 10.94 | Kernel per-CPU data |
| zRAM physical allocation | 858,188 kB | 838.07 | Compressed swap plus allocator overhead |
| Free RAM | 84,268 kB | 82.29 | Completely unused pages |
| Residual/unclassified | 488,944 kB | 477.48 | Drivers, vmalloc, DMA/graphics, vendor/kernel allocations and accounting differences |
| **Total** | **3,726,076 kB** | **3,638.75** | |

`MemAvailable: 525068 kB` means approximately **512.76 MiB** was estimated to be allocatable without severe reclaim or swapping. It is not an additional category in the table.

Additional overlapping classifications:

| Field | Value | Meaning |
|---|---:|---|
| `CmaTotal` | 680.00 MiB | Contiguous-memory pool included in `MemTotal` |
| `CmaFree` | 39.31 MiB | Only 5.8% currently free |
| Derived CMA occupied | 640.69 MiB | Overlaps anonymous, cache, zRAM, or driver allocations; not additive |
| `System` | 124.84 MiB | Vendor-specific bucket; exact semantics unavailable |
| `DmaHeapPool` | 1.43 MiB | DMA heap pool only, not necessarily total graphics buffers |
| `VmallocUsed` | 201.17 MiB | Virtual kernel mappings; not safely additive to physical totals |
| `Mapped` | 304.16 MiB | Subset of resident mappings, not additional usage |
| `SwapCached` | 24.63 MiB | Resident pages that retain a swap slot; overlaps anonymous RAM |

**Processes**
Only UID `10381` (`u0_a381`, Termux) was visible.

| Process | RSS | PSS | Anonymous PSS | SwapPSS | Notes |
|---|---:|---:|---:|---:|---|
| `opencode` | 212.34 MiB | 210.30 MiB | 192.18 MiB | 607.48 MiB | Dominant accessible consumer |
| Proxy `python` | 8.75 MiB | 6.63 MiB | 3.55 MiB | 8.77 MiB | AgentRouter proxy |
| `com.termux` | 38.45 MiB | 3.63 MiB | 1.89 MiB | 46.22 MiB | RSS mostly shared Android/ART mappings |
| Playwright MCP `node` | 1.94 MiB | 0.01 MiB | 0 | 60.98 MiB | Almost entirely cold/swapped |
| Other shells/wrappers | N/A | 0.68 MiB | negligible | 8.37 MiB | Combined |
| **Accessible total** | Not summed | **221.26 MiB** | **198.04 MiB** | **731.82 MiB** | PSS-based total |

`opencode` had a **17.29 GiB VSS**, but this is sparse virtual reservation, not physical memory. `showmap` identified `[anon:mimalloc]` as its main allocation: approximately **219 MiB resident** and **488 MiB swapped** in that earlier snapshot.

PSS represents the process's proportional physical share. SwapPSS represents proportional logical swapped data. The latter occupies less physical RAM because zRAM compresses it.

**Kernel Memory**
- Slab remained relatively stable at **433 to 437 MiB** during the investigation.
- `SReclaimable`: **136.34 MiB**, 31.4% of slab.
- `SUnreclaim`: **297.46 MiB**, 68.6% of slab and 8.2% of visible RAM.
- Slab plus stacks, page tables, and per-CPU allocations total approximately **661.10 MiB**.
- The combined kernel and shadow stacks imply roughly **4,970 to 4,980 threads**, assuming typical 16 KiB ARM64 kernel stacks and 4 KiB shadow stacks. This is an estimate, but both counters independently produce nearly the same result.
- `PageTables` at **119.21 MiB** is notable and is consistent with many Android processes, threads, and large ART/WebView mappings.
- `Committed_AS: 232.88 GiB` is virtual commitment under overcommit, not resident RAM.
- Individual slab cache names, object counts, and allocation sizes could not be inspected. `/proc/slabinfo` and `/sys/kernel/slab` were denied. Consequently, binder, task, inode, networking, SELinux, and vendor cache contributions remain unknown.
- There is no short-term evidence of a rapidly growing slab leak, but the inaccessible cache-level data prevents ruling one out.

**Swap And zRAM**
Configuration:

| Measurement | Raw | Converted |
|---|---:|---:|
| `disksize` | 3,221,225,472 bytes | 3,072 MiB |
| `SwapTotal` | 3,145,724 kB | 3,072 MiB minus one 4 KiB page |
| Algorithm | `lzo lzo-rle [lz4] zstd` | LZ4 selected |
| Compression streams | `8` | One per CPU possible |
| Backing device | `none` | No disk-backed zRAM writeback |
| Writeback enabled | `0` | Disabled |
| Final original data | 2,921,816,064 bytes | 2,786.46 MiB |
| Final compressed payload | 834,924,334 bytes | 796.25 MiB |
| Final physical usage | 878,768,128 bytes | 838.06 MiB |
| Peak physical usage | 1,078,059,008 bytes | 1,028.12 MiB |
| Allocator overhead | 43,843,794 bytes | 41.81 MiB |
| Payload compression ratio | 3.50:1 | Excludes overhead |
| Effective compression ratio | 3.32:1 | Includes overhead |
| Same-filled pages | 41,306 pages | 161.35 MiB logical |
| Incompressible pages | 24,887 pages | 97.21 MiB |
| Pages compacted | 14,766,631 pages | 56.33 GiB cumulative |

The final logical utilization was **90.74%**, but it reached **99.96%** during the investigation.

Measured activity:

| Interval | Reads | Writes | Net swap change |
|---|---:|---:|---:|
| 15.53 seconds, active investigation | 169.13 MiB, 10.89 MiB/s | 526.69 MiB, 33.91 MiB/s | +205.32 MiB |
| 20.14 seconds, quieter wait | 66.77 MiB, 3.31 MiB/s | 58.97 MiB, 2.93 MiB/s | -5.83 MiB |

At approximately 33 hours 48 minutes uptime, cumulative zRAM block counters showed:

- **582.39 GiB logical reads**
- **818.85 GiB logical writes**
- **816.62 GiB swap-slot free notifications**

These are RAM compression operations, not flash writes. If the device was initialized at boot, they imply prolonged swap churn. The exact start time of the counters cannot be confirmed.

`sys.sysctl.swappiness=145` indicates intentionally aggressive anonymous-page eviction to zRAM. `lmkd` is running, and configured policy values include `ro.lmk.swap_util_max=90`; observed utilization exceeded that threshold. This does not prove that LMKD killed processes because its logs were unavailable.

**Android Consumers**
| Component | Result |
|---|---|
| Android framework/system server | Unknown: ActivityManager dump denied |
| System UI and One UI | Unknown: non-Termux PIDs hidden |
| Google Play services | Unknown: non-Termux PIDs hidden |
| ART and Zygote | Global usage unknown; shared ART mappings are visible only through Termux PSS |
| SurfaceFlinger/gralloc | Unknown: SurfaceFlinger dump denied |
| GPU | Mali device exists, but `/proc/mtk_mali/gpu_memory` was denied |
| DMA buffers | Unknown: `dmabuf_dump` reported no accessible information |
| Samsung/vendor services | Service names visible, process memory hidden |
| Memtrack/ION services | Commands returned no data; this must not be interpreted as zero usage |

The nearly occupied CMA pool and the **477 MiB residual** are compatible with graphics, camera, display, or vendor driver allocations, but they are not proof of any specific consumer.

**Performance**
- zRAM is both a cost and a benefit. It consumed about **838 MiB RAM** but represented about **2.79 GiB logical data**, saving roughly **1.90 GiB physical RAM**.
- Active compression and decompression can consume CPU and memory bandwidth and may contribute to pauses or app reloads.
- The quieter sample still showed hundreds of zRAM I/O operations per second.
- Load average remained near **29** on an eight-core device, which is high, but inaccessible process and PSI data prevent attributing it to memory stalls.
- Disabling zRAM would likely cause earlier LMKD kills or out-of-memory failures rather than improve the device.
- File cache was only about **424 MiB excluding shmem** and is reclaimable. Clearing it would offer temporary numbers, not address the underlying anonymous-memory demand.
- Low `MemFree` is normal and was not itself the problem.

**Unknowns**
- Approximately **457.25 MiB** is outside Linux `MemTotal`; `/proc/iomem` was denied, preventing carve-out attribution.
- Approximately **477.48 MiB inside `MemTotal`** could not be uniquely classified.
- Around **2.1 to 2.3 GiB logical swap** belonged to inaccessible Android processes or shared memory at the sampled times.
- Individual slab caches and GPU/dma-buf allocations remain unavailable.
- PSI, page-scan, allocation-stall, swap-in/out VM counters, zone watermarks, and fragmentation were denied.
- The investigation itself used `opencode` and transient commands, so the first high-churn interval includes observer workload. The quieter interval confirms churn persisted at a lower rate.

**Recommendations**
1. After saving work, normally exit unused `opencode`, Playwright MCP, and stale Termux sessions. Expected benefit: high. Risk: low except for unsaved session state. The accessible UID held about **732 MiB SwapPSS**, dominated by `opencode`.
2. Capture an authorized ADB-shell memory report while lag is occurring. Expected diagnostic benefit: high. Risk: low operationally, moderate security exposure while Developer Options or wireless debugging remains enabled.
3. Perform one controlled reboot after saving work, then compare `/proc/meminfo` and zRAM counters at idle and after workload. Expected benefit: medium and possibly temporary. Risk: normal reboot disruption.
4. Trend `Slab`, `SUnreclaim`, `KernelStack`, `PageTables`, zRAM physical use, and swap activity over several hours. Growth after a clean boot would provide much stronger evidence of a leak.
5. Do not clear caches, disable zRAM, alter swappiness, force-stop system services, or enable storage-backed “RAM expansion” based on this evidence. Expected benefit: low or negative. Risk: app kills, instability, and increased latency.

**Failures**
| Interface | Observed response |
|---|---|
| `/proc/vmstat`, `/proc/pressure/memory`, `/proc/swaps`, `/proc/zoneinfo` | `Permission denied` |
| `/proc/buddyinfo`, `/proc/pagetypeinfo`, `/proc/diskstats` | `Permission denied` |
| `/proc/slabinfo`, `/proc/vmallocinfo`, `/sys/kernel/slab` | `Permission denied` |
| `/proc/iomem` | `Permission denied` |
| `/proc/1/status` | `No such file or directory`, caused by filtered PID namespace |
| `dumpsys activity`, `procstats`, `SurfaceFlinger`, graphics services | Missing `android.permission.DUMP` |
| `dumpsys meminfo`, `gfxinfo` | Service not visible to this UID |
| `dumpsys gpu` | `FAILED_TRANSACTION` |
| Mali, DMA heap, GPU-frequency interfaces | `Permission denied` |
| `/system/bin/dmabuf_dump` | `dmabuf info not found` |
| Event `logcat` query | No output; not evidence of no LMK events |
| `zramctl` | No output because swap enumeration was inaccessible |
| `swapon` | Command not installed |
| ADB | Command not installed |
| `dmesg` | No usable result from the execution environment |

<details>
<summary><strong>Command Log</strong></summary>

Exact substantive read-only commands executed:

```sh
date -Ins
uname -a
id
getconf PAGE_SIZE
/system/bin/getconf PAGE_SIZE
/system/bin/pagesize
uptime
uptime -s
getprop ro.product.manufacturer
getprop ro.product.model
getprop ro.build.version.release
getprop ro.build.version.sdk
getprop ro.product.board
getprop ro.hardware
getprop ro.boot.ddr_size
getprop ro.config.low_ram
getprop | rg -i 'zram|lmk|low_ram|heap|swap|(^|[._])ram([._]|\])'
free -k
vmstat
```

```sh
cat /proc/meminfo
cat /proc/vmstat
cat /proc/pressure/memory
cat /proc/swaps
cat /proc/zoneinfo
cat /proc/buddyinfo
cat /proc/pagetypeinfo
cat /proc/uptime
cat /proc/slabinfo
cat /proc/vmallocinfo
cat /proc/iomem
cat /proc/diskstats
cat /proc/sys/vm/swappiness
cat /proc/sys/vm/page-cluster
cat /proc/sys/vm/min_free_kbytes
cat /proc/sys/vm/watermark_scale_factor
cat /proc/sys/vm/extra_free_kbytes
```

```sh
cat /sys/block/zram0/mm_stat
cat /sys/block/zram0/comp_algorithm
cat /sys/block/zram0/disksize
cat /sys/block/zram0/mem_limit
cat /sys/block/zram0/mem_used_max
cat /sys/block/zram0/max_comp_streams
cat /sys/block/zram0/backing_dev
cat /sys/block/zram0/io_stat
cat /sys/block/zram0/bd_stat
cat /sys/block/zram0/stat
cat /sys/block/zram0/inflight
cat /sys/block/zram0/writeback_limit_enable
cat /sys/block/zram0/writeback_limit
cat /sys/block/zram0/debug_stat
cat /sys/block/zram0/idle
swapon --show --bytes
zramctl
```

```sh
ps -A -o PID,PPID,UID,USER,STAT,RSS,VSZ,NAME,ARGS --sort=-RSS
/system/bin/ps -A -o PID,PPID,UID,USER,STAT,RSS,VSZ,NAME,ARGS
/system/bin/pidof system_server
/system/bin/procrank
/system/bin/showmap 31887
/system/bin/librank
/system/bin/dmabuf_dump
cat /proc/1/status
cat /proc/1/smaps_rollup
cat /proc/17679/smaps_rollup
cat /proc/31887/smaps_rollup
cat /proc/31889/smaps_rollup
cat /proc/32067/smaps_rollup
```

The same-UID ranking command was:

```sh
uid=$(id -u); rows=''; for d in /proc/[0-9]*; do [ -r "$d/status" ] || continue; pid=${d#/proc/}; name=''; ppid=0; procuid=-1; vmsize=0; vmrss=0; while IFS=': \t' read -r key value rest; do case "$key" in Name) name=$value;; PPid) ppid=$value;; Uid) procuid=$value;; VmSize) vmsize=$value;; VmRSS) vmrss=$value;; esac; done < "$d/status"; [ "$procuid" = "$uid" ] || continue; [ -r "$d/smaps_rollup" ] || continue; rss=0; pss=0; pssanon=0; pssfile=0; pssshmem=0; swap=0; swappss=0; while IFS=': ' read -r key value unit; do case "$key" in Rss) rss=$value;; Pss) pss=$value;; Pss_Anon) pssanon=$value;; Pss_File) pssfile=$value;; Pss_Shmem) pssshmem=$value;; Swap) swap=$value;; SwapPss) swappss=$value;; esac; done < "$d/smaps_rollup"; rows="${rows}${pid}\t${ppid}\t${name}\t${vmsize}\t${rss}\t${pss}\t${pssanon}\t${pssfile}\t${pssshmem}\t${swap}\t${swappss}\n"; done; printf 'PID\tPPID\tNAME\tVSS_kB\tRSS_kB\tPSS_kB\tPSS_ANON_kB\tPSS_FILE_kB\tPSS_SHMEM_kB\tSWAP_kB\tSWAP_PSS_kB\n'; printf '%b' "$rows" | sort -t "$(printf '\t')" -k6,6nr
```

```sh
/system/bin/dumpsys -l
/system/bin/dumpsys meminfo
/system/bin/dumpsys meminfo -a
/system/bin/dumpsys activity processes
/system/bin/dumpsys activity oom
/system/bin/dumpsys activity lru
/system/bin/dumpsys procstats --hours 1
/system/bin/dumpsys SurfaceFlinger
/system/bin/dumpsys gfxinfo
/system/bin/dumpsys gpu
/system/bin/dumpsys graphicsstats
/system/bin/dumpsys hardware_properties
/system/bin/dumpsys memtrack.proxy
/system/bin/dumpsys ions
/system/bin/cmd activity processes
/system/bin/cmd activity get-uid-state 10381
```

```sh
cat /proc/mtk_mali/gpu_memory
cat /proc/mtk_mali/utilization
cat /proc/ged
cat /proc/mgq/job_status
cat /proc/mtkfb
ls -laZ /proc/dma_heap
ls -laZ /proc/mtk_mali
ls -laZ /proc/gpufreqv2
ls -laZ /sys/kernel/dmabuf
ls -laZ /sys/kernel/dma_heap
ls -laZ /sys/kernel/debug/dma_buf
ls -laZ /sys/kernel/debug
ls -laZ /sys/class/misc/mali0
ls -laZ /sys/class/misc/mali0/device
```

Controlled samples:

```sh
date -Ins && free -k && cat /sys/block/zram0/mm_stat && cat /sys/block/zram0/stat && cat /sys/block/zram0/io_stat && sleep 15 && date -Ins && free -k && cat /sys/block/zram0/mm_stat && cat /sys/block/zram0/stat && cat /sys/block/zram0/io_stat
```

```sh
date -Ins && uptime && free -k && cat /sys/block/zram0/mm_stat && cat /sys/block/zram0/stat && cat /sys/block/zram0/io_stat && sleep 20 && date -Ins && uptime && free -k && cat /sys/block/zram0/mm_stat && cat /sys/block/zram0/stat && cat /sys/block/zram0/io_stat
```

```sh
date -Ins && cat /proc/meminfo && cat /sys/block/zram0/mm_stat
```

No settings, processes, caches, packages, swap configuration, or files were modified.

</details>

---

