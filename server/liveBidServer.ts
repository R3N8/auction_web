import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import crypto from "crypto";

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const auctions = new Map();

const io = new Server(server, {
  path: "/auction/socket.io",
  cors: {
    origin: "https://web-auction.netlify.app",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});

io.on("connection", (socket) => {
  console.log("client connected: ", socket.id);
  //join specific auction room
  socket.on("join-auction", (listingId) => {
    socket.join(listingId);

    if (!auctions.has(listingId)) {
      auctions.set(listingId, {
        bids: [],
        highestBid: 0,
        ended: false,
      });
    }
  });

  //new live bid
  socket.on("new-bid", ({ listingId, amount, bidder }) => {
    const auction = auctions.get(listingId);

    if (!auction) {
      socket.emit("bid-rejected", "Auction not found.");
      return;
    }

    if (auction.ended) {
      socket.emit("bid-rejected", "Auction has already ended.");
      return;
    }

    const nummericAmount = Number(amount);
    if (auction.bids.length === 0 && nummericAmount <= 0) {
      socket.emit("bid-rejected", "First bid must be higher than 0.");
      return;
    }

    if (auction.bids.length > 0 && nummericAmount <= auction.highestBid) {
      socket.emit(
        "bid-rejected",
        `Bid must be higher than ${auction.highestBid}`,
      );
      return;
    }

    const bid = {
      id: crypto.randomUUID(),
      amount: nummericAmount,
      bidder,
      created: new Date().toISOString(),
    };

    auction.bids.push(bid);
    auction.highestBid = nummericAmount;

    io.to(listingId).emit("bid-update", bid);
  });

  //typing indicator
  socket.on("typing", (listingId) => {
    socket.to(listingId).emit("user-typing");
  });

  socket.on("stop-typing", (listingId) => {
    socket.to(listingId).emit("user-stop-typing");
  });

  socket.on("auction-ended", ({ listingId, winner, losers }) => {
    const auction = auctions.get(listingId);

    if (!auction) return;

    auction.ended = true;

    io.to(listingId).emit("auction-ended", {
      winner,
      losers,
    });
  });
});
