# 🪑 Workflow: Rooms, Tracks & Seat Allocation

Event OS features an automated seat allocation engine that groups teams by track, balances room capacities, supports manual organizer overrides, and allows bilateral team seat swaps.

---

## 🏗️ Allocation Strategies

1. **`TRACK_LARGEST_FIRST` (Default):**
   - Groups teams by registered track (e.g. AI, Web3, FinTech).
   - Sorts rooms by capacity.
   - Assigns contiguous blocks of seats in the same room to teams of the same track to foster domain collaboration.
2. **`SEQUENTIAL`:**
   - Assigns teams linearly across available rooms and seat tables as they check in.

---

## 🔄 Allocation & Reveal Lifecycle

```text
[ Organizer Creates Rooms & Capacities ] ──► POST /api/events/:id/rooms
                                                          │
[ Organizer Triggers Algorithmic Allocation ] ──► POST /api/events/:id/seats/allocate
                                                          │
                                                          ▼
                           [ Backend calculates room/seat labels for teams ]
                                                          │
                    ┌─────────────────────────────────────┴─────────────────────────────────────┐
                    ▼                                                                           ▼
       [ Before Gate Check-in ]                                                    [ After Gate Check-in ]
     Frontend shows: "Checked-in status required                                  Frontend reveals:
      to view your assigned table."                                               "Room: Hall B | Table: 12-A"
```

---

## 🛠️ API Reference

### 1. Create Room
- **Endpoint:** `POST /api/events/:id/rooms`
- **Body:** `{ "name": "Main Arena Hall A", "capacity": 120 }`

### 2. Algorithmic Allocation
- **Endpoint:** `POST /api/events/:id/seats/allocate`
- **Body:** `{ "strategy": "TRACK_LARGEST_FIRST" }`

### 3. Manual Seat Override
- **Endpoint:** `POST /api/events/:id/seats/manual`
- **Body:**
  ```json
  {
    "teamId": "t1-uuid",
    "roomId": "r1-uuid",
    "seatLabel": "VIP Table 01"
  }
  ```

### 4. Swap Seats
- **Endpoint:** `POST /api/events/:id/seats/swap`
- **Body:**
  ```json
  {
    "teamAId": "t1-uuid",
    "teamBId": "t2-uuid"
  }
  ```
