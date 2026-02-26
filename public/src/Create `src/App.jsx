import { useState, useEffect } from "react";
import {
  ArrowUpRight, ArrowLeftRight, Image, Lock, Clock, Wallet,
  TrendingUp, Send, RefreshCw, Shield, CheckCircle, AlertCircle,
  Loader, Zap, ExternalLink
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

const FEE_AMOUNT    = 1;
const FEE_WALLET    = "0xa28f6f51a208a2ea67fcba9d8f8d4f17c0c21df7";
const BUILDER_X     = "https://x.com/Bash06809279101";
const BUILDER_NAME  = "@Bash06809279101";

const MOCK_NFTS = [
  { id: 1, name: "Arc Genesis #001", emoji: "🌌", price: "50",  rarity: "Legendary" },
  { id: 2, name: "Arc Genesis #042", emoji: "🔮", price: "120", rarity: "Rare"      },
  { id: 3, name: "Arc Rare #007",    emoji: "💎", price: "250", rarity: "Epic"      },
  { id: 4, name: "Arc Common #099",  emoji: "🌀", price: "20",  rarity: "Common"    },
];

const SWAP_PAIRS = {
  "USDC→ETH":   0.000385,
  "USDC→MATIC": 1.23,
  "USDC→USDT":  0.9998,
  "ETH→USDC":   2597,
  "MATIC→USDC": 0.813,
};

const LOCK_OPTIONS = [7, 14, 30, 60, 90, 180, 365];

const genPriceHistory = () => {
  let p = 1.0001;
  return Array.from({ length: 20 }, (_, i) => {
    p += (Math.random() - 0.5) * 0.0003;
    return { t: `${i + 1}m`, price: +p.toFixed(4) };
  });
};

const truncate = (a) => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "";
const fmt      = (n) => Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const randHash = ()  => "0x" + Math.random().toString(16).slice(2, 18);

function Toast({ toast }) {
  if (!toast) return null;
  const isErr = toast.type === "error";
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 9999,
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 20px", borderRadius: 12,
      background: isErr ? "#450a0a" : "#052e16",
      border: `1px solid ${isErr ? "#ef4444" : "#22c55e"}`,
      color: "#fff", fontSize: 13, fontWeight: 500,
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxWidth: 340
    }}>
      {isErr ? <AlertCircle size={15} color="#f87171" /> : <CheckCircle size={15} color="#4ade80" />}
      <span>{toast.msg}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, borderColor }) {
  return (
    <div style={{
      background: "rgba(30,41,59,0.6)", border: "1px solid rgba(71,85,105,0.4)",
      borderLeft: `4px solid ${borderColor}`, borderRadius: 16, padding: "20px"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: 11, marginBottom: 10 }}>
        <Icon size={13} />{label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#64748b" }}>{sub}</div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, color: "#94a3b8", marginBottom: 6, fontWeight: 500 }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
        style={{ width: "100%", padding: "11px 14px", boxSizing: "border-box", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(71,85,105,0.5)", borderRadius: 10, color: "#fff", fontSize: 13, outline: "none" }} />
      {hint && <div style={{ fontSize: 11, color: "#64748b", marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

function ActionBtn({ onClick, loading, label, icon: Icon, gradient }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      width: "100%", padding: "13px", border: "none", borderRadius: 12,
      background: gradient || "linear-gradient(135deg, #6366f1, #8b5cf6)",
      color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      opacity: loading ? 0.6 : 1, transition: "opacity 0.2s"
    }}>
      {loading ? <Loader size={15} style={{ animation: "spin 1s linear infinite" }} /> : Icon ? <Icon size={15} /> : null}
      {loading ? "Processing..." : label}
    </button>
  );
}

function Panel({ children, title, icon: Icon, iconColor }) {
  return (
    <div style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(71,85,105,0.4)", borderRadius: 20, padding: 24 }}>
      {title && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          {Icon && <Icon size={17} color={iconColor || "#818cf8"} />}
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: 0 }}>{title}</h2>
        </div>
      )}
      {children}
    </div>
  );
}

function FeeNotice() {
  return (
    <div style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
      <Zap size={13} color="#facc15" />
      <span style={{ color: "#94a3b8" }}>
        <span style={{ color: "#facc15", fontWeight: 600 }}>1 USDC fee</span> is charged per transaction and sent to the builder wallet.
      </span>
    </div>
  );
}

function TxRow({ tx }) {
  const isFee = tx.type === "Fee";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 15px", background: isFee ? "rgba(234,179,8,0.05)" : "rgba(15,23,42,0.5)", border: `1px solid ${isFee ? "rgba(234,179,8,0.2)" : "rgba(71,85,105,0.3)"}`, borderRadius: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ width: 36, height: 36, background: "rgba(30,41,59,0.8)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{tx.icon}</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: isFee ? "#facc15" : "#fff" }}>{tx.type}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{tx.detail}</div>
          <div style={{ fontSize: 10, color: "#475569" }}>{tx.date}</div>
        </div>
      </div>
      <a href={`https://explorer.testnet.arc.io/tx/${tx.hash}`} target="_blank" rel="noreferrer"
        style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#818cf8", textDecoration: "none" }}>
        {truncate(tx.hash)} <ArrowUpRight size={10} />
      </a>
    </div>
  );
}

export default function ArcDashboard() {
  const [tab, setTab]           = useState("overview");
  const [wallet, setWallet]     = useState(null);
  const [balance, setBalance]   = useState(1250.75);
  const [totalFeesSent, setFees]= useState(0);
  const [usdcPrice, setPrice]   = useState(1.0001);
  const [priceHistory, setPH]   = useState(genPriceHistory());
  const [txHistory, setTxH]     = useState([]);
  const [toast, setToast]       = useState(null);

  const [toAddr, setToAddr]   = useState("");
  const [sendAmt, setSendAmt] = useState("");
  const [sendLoad, setSendL]  = useState(false);

  const [swapFrom, setSwapF] = useState("USDC");
  const [swapTo, setSwapT]   = useState("ETH");
  const [swapAmt, setSwapAmt]= useState("");
  const [swapLoad, setSwapL] = useState(false);

  const [lockAmt, setLockAmt]   = useState("");
  const [lockDays, setLockDays] = useState("30");
  const [locks, setLocks]       = useState([
    { id: 1, amount: 500, unlockDate: new Date(Date.now() + 15 * 864e5).toLocaleDateString() }
  ]);
  const [lockLoad, setLockL] = useState(false);

  const [mintedNfts, setMinted] = useState([]);
  const [mintingId, setMintId]  = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const t = setInterval(() => {
      const d = (Math.random() - 0.5) * 0.0003;
      setPrice(p => +(p + d).toFixed(4));
      setPH(h => {
        const last = h[h.length - 1].price;
        return [...h.slice(1), { t: "now", price: +(last + d).toFixed(4) }];
      });
    }, 2500);
    return () => clearInterval(t);
  }, []);

  const addTxWithFee = (mainTx, deductMain = 0) => {
    const now = new Date().toLocaleString();
    const mainEntry = { ...mainTx, date: now, hash: randHash() };
    const feeEntry  = {
      type: "Fee", icon: "⚡",
      detail: `1 USDC fee → ${truncate(FEE_WALLET)}`,
      date: now, hash: randHash()
    };
    setTxH(h => [feeEntry, mainEntry, ...h]);
    setBalance(b => +(b - deductMain - FEE_AMOUNT).toFixed(2));
    setFees(f => +(f + FEE_AMOUNT).toFixed(2));
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const [addr] = await window.ethereum.request({ method: "eth_requestAccounts" });
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0x279F",
            chainName: "Arc Testnet",
            nativeCurrency: { name: "ARC", symbol: "ARC", decimals: 18 },
            rpcUrls: ["https://rpc.testnet.arc.io"],
            blockExplorerUrls: ["https://explorer.testnet.arc.io"],
          }],
        });
        setWallet(addr);
        showToast("Wallet connected to Arc Testnet!");
      } catch (e) { showToast(e.message, "error"); }
    } else {
      setWallet("0xDemoWallet1234567890abcdefABCDEF12345678");
      showToast("Demo mode — MetaMask not detected");
    }
  };

  const handleSend = async () => {
    if (!toAddr || !sendAmt)             return showToast("Fill all fields", "error");
    if (+sendAmt <= 0)                   return showToast("Enter a valid amount", "error");
    if (+sendAmt + FEE_AMOUNT > balance) return showToast(`Need ${+sendAmt + FEE_AMOUNT} USDC (amount + 1 fee)`, "error");
    setSendL(true);
    await new Promise(r => setTimeout(r, 1800));
    addTxWithFee({ type: "Transfer", icon: "📤", detail: `${sendAmt} USDC → ${truncate(toAddr)}` }, +sendAmt);
    showToast(`Sent ${sendAmt} USDC + 1 USDC fee charged`);
    setSendAmt(""); setToAddr(""); setSendL(false);
  };

  const swapKey  = `${swapFrom}→${swapTo}`;
  const swapRate = SWAP_PAIRS[swapKey] ?? 1;
  const swapOut  = swapAmt ? (Number(swapAmt) * swapRate).toFixed(6) : "0";

  const handleSwap = async () => {
    if (!swapAmt || +swapAmt <= 0) return showToast("Enter amount", "error");
    const usdcNeeded = swapFrom === "USDC" ? +swapAmt + FEE_AMOUNT : FEE_AMOUNT;
    if (usdcNeeded > balance)      return showToast(`Need ${fmt(usdcNeeded)} USDC (amount + 1 fee)`, "error");
    setSwapL(true);
    await new Promise(r => setTimeout(r, 2000));
    const deductAmt = swapFrom === "USDC" ? +swapAmt : 0;
    addTxWithFee({ type: "Swap", icon: "🔄", detail: `${swapAmt} ${swapFrom} → ${swapOut} ${swapTo}` }, deductAmt);
    showToast(`Swapped ${swapAmt} ${swapFrom} for ${swapOut} ${swapTo} (+1 USDC fee)`);
    setSwapAmt(""); setSwapL(false);
  };

  const handleLock = async () => {
    if (!lockAmt || +lockAmt <= 0)       return showToast("Enter valid amount", "error");
    if (+lockAmt + FEE_AMOUNT > balance) return showToast(`Need ${+lockAmt + FEE_AMOUNT} USDC (amount + 1 fee)`, "error");
    setLockL(true);
    await new Promise(r => setTimeout(r, 1600));
    const unlockDate = new Date(Date.now() + Number(lockDays) * 864e5).toLocaleDateString();
    setLocks(l => [...l, { id: Date.now(), amount: +lockAmt, unlockDate }]);
    addTxWithFee({ type: "Lock", icon: "🔒", detail: `${lockAmt} USDC locked for ${lockDays} days (unlocks ${unlockDate})` }, +lockAmt);
    showToast(`Locked ${lockAmt} USDC for ${lockDays} days (+1 USDC fee)`);
    setLockAmt(""); setLockL(false);
  };

  const handleMint = async (nft) => {
    if (!wallet)          return showToast("Connect wallet first", "error");
    if (FEE_AMOUNT > balance) return showToast("Insufficient USDC for fee", "error");
    setMintId(nft.id);
    await new Promise(r => setTimeout(r, 1600));
    setMinted(m => [...m, nft.id]);
    addTxWithFee({ type: "NFT Mint", icon: "🖼️", detail: `Minted ${nft.name} (${nft.price} USDC)` }, 0);
    showToast(`Minted ${nft.name}! (+1 USDC fee)`);
    setMintId(null);
  };

  const lockedTotal = locks.reduce((a, l) => a + l.amount, 0);
  const txCount = txHistory.length;
  const rarityColor = { Legendary: "#facc15", Epic: "#c084fc", Rare: "#60a5fa", Common: "#94a3b8" };

  const TABS = [
    { id: "overview", label: "Overview", Icon: TrendingUp },
    { id: "transfer", label: "Transfer", Icon: Send },
    { id: "swap",     label: "Swap",     Icon: ArrowLeftRight },
    { id: "nft",      label: "NFTs",     Icon: Image },
    { id: "lock",     label: "Lock",     Icon: Lock },
    { id: "history",  label: "History",  Icon: Clock },
  ];

  const selectStyle = {
    width: "100%", padding: "11px 14px", boxSizing: "border-box",
    background: "rgba(15,23,42,0.8)", border: "1px solid rgba(71,85,105,0.5)",
    borderRadius: 10, color: "#fff", fontSize: 13, outline: "none", cursor: "pointer"
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)", color: "#e2e8f0", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none }
      `}</style>
      <Toast toast={toast} />

      <div style={{ borderBottom: "1px solid rgba(71,85,105,0.4)", background: "rgba(15,23,42,0.8)", backdropFilter: "blur(12px)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19 }}>⚡</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>Arc Testnet DeFi</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>Chain ID 10143 · Testnet</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#64748b" }}>USDC Price</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#4ade80" }}>${usdcPrice}</div>
          </div>
          <button onClick={connectWallet} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10,
            background: wallet ? "rgba(16,185,129,0.15)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: wallet ? "1px solid rgba(16,185,129,0.4)" : "none",
            color: wallet ? "#4ade80" : "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer"
          }}>
            <Wallet size={13} />
            {wallet ? truncate(wallet) : "Connect Wallet"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "20px 16px 40px" }}>

        <a href={BUILDER_X} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16, padding: "9px 16px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12, fontSize: 12, color: "#a5b4fc" }}>
            <span style={{ color: "#64748b" }}>Built by</span>
            <span style={{ fontWeight: 700, color: "#818cf8" }}>{BUILDER_NAME}</span>
            <ExternalLink size={11} color="#818cf8" />
          </div>
        </a>

        <div style={{ display: "flex", gap: 3, background: "rgba(30,41,59,0.5)", padding: 4, borderRadius: 16, marginBottom: 22, overflowX: "auto" }}>
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: "1 0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              padding: "9px 10px", borderRadius: 12, border: "none",
              background: tab === id ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "transparent",
              color: tab === id ? "#fff" : "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer"
            }}>
              <Icon size={12} />{label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <StatCard icon={Wallet}     label="USDC Balance"   value={`${fmt(balance)} USDC`}         sub="Available to use"               borderColor="#6366f1" />
              <StatCard icon={TrendingUp} label="USD Value"       value={`$${fmt(balance * usdcPrice)}`}  sub={`@ $${usdcPrice} per USDC`}     borderColor="#22c55e" />
              <StatCard icon={Lock}       label="Locked USDC"    value={`${fmt(lockedTotal)} USDC`}      sub={`${locks.length} active lock(s)`} borderColor="#f59e0b" />
              <StatCard icon={Clock}      label="Total Tx Count" value={txCount}                          sub="All transactions incl. fees"    borderColor="#8b5cf6" />
            </div>
            <div style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 14, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Zap size={15} color="#facc15" />
                <div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Total Fees Sent to Builder</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{truncate(FEE_WALLET)}</div>
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#facc15" }}>{fmt(totalFeesSent)} USDC</div>
            </div>
            <div style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(71,85,105,0.4)", borderRadius: 20, padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>USDC Live Price</div>
                <div style={{ fontSize: 11, padding: "4px 10px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80", borderRadius: 8 }}>${usdcPrice}</div>
              </div>
              <ResponsiveContainer width="100%" height={155}>
                <LineChart data={priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="t" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} width={55} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }} />
                  <Line type="monotone" dataKey="price" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === "transfer" && (
          <Panel title="Transfer USDC" icon={Send} iconColor="#818cf8">
            <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
              Balance: <span style={{ color: "#4ade80", fontWeight: 700 }}>{fmt(balance)} USDC</span>
            </div>
            <FeeNotice />
            <Input label="Recipient Address" value={toAddr} onChange={setToAddr} placeholder="0x..." />
            <Input label="Amount (USDC)" value={sendAmt} onChange={setSendAmt} placeholder="0.00" type="number"
              hint={sendAmt ? `Total deducted: ${fmt(+sendAmt + FEE_AMOUNT)} USDC (${sendAmt} + 1 fee)` : ""} />
            <ActionBtn onClick={handleSend} loading={sendLoad} label="Send USDC (+ 1 USDC fee)" icon={Send} />
          </Panel>
        )}

        {tab === "swap" && (
          <Panel title="Swap Tokens" icon={ArrowLeftRight} iconColor="#c084fc">
            <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
              Balance: <span style={{ color: "#4ade80", fontWeight: 700 }}>{fmt(balance)} USDC</span>
            </div>
            <FeeNotice />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 1fr", gap: 12, alignItems: "end", marginBottom: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>From</label>
                <select value={swapFrom} onChange={e => setSwapF(e.target.value)} style={selectStyle}>
                  {["USDC","ETH","MATIC"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", justifyContent: "center", paddingBottom: 4 }}>
                <div style={{ width: 32, height: 32, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ArrowLeftRight size={13} color="#818cf8" />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>To</label>
                <select value={swapTo} onChange={e => setSwapT(e.target.value)} style={selectStyle}>
                  {["ETH","USDC","MATIC","USDT"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <Input label="Amount" value={swapAmt} onChange={setSwapAmt} placeholder="0.00" type="number" />
            <div style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(71,85,105,0.4)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
              {[
                ["Rate",         `1 ${swapFrom} = ${SWAP_PAIRS[swapKey] ?? "—"} ${swapTo}`],
                ["You receive",  `${swapOut} ${swapTo}`],
                ["Protocol fee", "1 USDC → builder"],
                ["Slippage",     "0.5%"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13 }}>
                  <span style={{ color: "#94a3b8" }}>{k}</span>
                  <span style={{ color: k === "You receive" ? "#4ade80" : k === "Protocol fee" ? "#facc15" : "#fff", fontWeight: ["You receive","Protocol fee"].includes(k) ? 700 : 400 }}>{v}</span>
                </div>
              ))}
            </div>
            <ActionBtn onClick={handleSwap} loading={swapLoad} label={`Swap ${swapFrom} → ${swapTo} (+ 1 USDC fee)`} icon={RefreshCw} gradient="linear-gradient(135deg, #7c3aed, #db2777)" />
          </Panel>
        )}

        {tab === "nft" && (
          <Panel title="Arc NFT Marketplace" icon={Image} iconColor="#f472b6">
            <FeeNotice />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {MOCK_NFTS.map(nft => {
                const owned   = mintedNfts.includes(nft.id);
                const minting = mintingId === nft.id;
                return (
                  <div key={nft.id} style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(71,85,105,0.4)", borderRadius: 16, overflow: "hidden" }}>
                    <div style={{ height: 90, background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>{nft.emoji}</div>
                    <div style={{ padding: 14 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{nft.name}</div>
                      <div style={{ fontSize: 11, color: rarityColor[nft.rarity], marginBottom: 2 }}>{nft.rarity}</div>
                      <div style={{ color: "#818cf8", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{nft.price} USDC</div>
                      <div style={{ fontSize: 10, color: "#facc15", marginBottom: 10 }}>+ 1 USDC fee</div>
                      {owned ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#4ade80", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "7px 10px" }}>
                          <CheckCircle size={11} /> Owned
                        </div>
                      ) : (
                        <button onClick={() => handleMint(nft)} disabled={!!mintingId} style={{
                          width: "100%", padding: "8px", border: "none", borderRadius: 8,
                          background: "linear-gradient(135deg, #db2777, #be185d)",
                          color: "#fff", fontSize: 12, fontWeight: 700, cursor: mintingId ? "not-allowed" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                          opacity: mintingId ? 0.5 : 1
                        }}>
                          {minting ? <><Loader size={11} style={{ animation: "spin 1s linear infinite" }} /> Minting...</> : "Mint NFT"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        )}

        {tab === "lock" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Panel title="Lock USDC" icon={Lock} iconColor="#fbbf24">
              <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
                Balance: <span style={{ color: "#4ade80", fontWeight: 700 }}>{fmt(balance)} USDC</span>
              </div>
              <FeeNotice />
              <Input label="Amount to Lock (USDC)" value={lockAmt} onChange={setLockAmt} placeholder="0.00" type="number" />
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>Lock Duration</label>
                <select value={lockDays} onChange={e => setLockDays(e.target.value)} style={selectStyle}>
                  {LOCK_OPTIONS.map(d => <option key={d} value={d}>{d} Day{d > 1 ? "s" : ""}{d === 30 ? " ★ Popular" : d === 365 ? " (1 Year)" : ""}</option>)}
                </select>
              </div>
              {lockAmt && (
                <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                  {[
                    ["Lock amount",    `${fmt(lockAmt)} USDC`],
                    ["Protocol fee",   "1 USDC → builder"],
                    ["Total deducted", `${fmt(+lockAmt + FEE_AMOUNT)} USDC`],
                    ["Unlock date",    new Date(Date.now() + Number(lockDays) * 864e5).toLocaleDateString()],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13 }}>
                      <span style={{ color: "#94a3b8" }}>{k}</span>
                      <span style={{ color: k === "Unlock date" ? "#fbbf24" : k === "Protocol fee" ? "#facc15" : "#fff", fontWeight: 700 }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
              <ActionBtn onClick={handleLock} loading={lockLoad} label="Lock USDC (+ 1 USDC fee)" icon={Shield} gradient="linear-gradient(135deg, #d97706, #ea580c)" />
            </Panel>
            <Panel title="Active Locks" icon={Lock} iconColor="#fbbf24">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {locks.map(l => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "rgba(15,23,42,0.5)", border: "1px solid rgba(71,85,105,0.3)", borderRadius: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "#fbbf24" }}>{fmt(l.amount)} USDC</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>Unlocks {l.unlockDate}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24", padding: "5px 10px", borderRadius: 8, fontWeight: 600 }}>
                      <Lock size={10} /> Locked
