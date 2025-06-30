import { component$, useStylesScoped$ } from '@builder.io/qwik';

export const CyberpunkTerminal = component$(() => {
  useStylesScoped$(`
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes titleGlow {
      from {
        text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
      }
      to {
        text-shadow: 0 0 30px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.3);
      }
    }

    @keyframes redGlow {
      from {
        text-shadow: 0 0 20px rgba(255, 49, 49, 0.5);
      }
      to {
        text-shadow: 0 0 30px rgba(255, 49, 49, 0.8), 0 0 40px rgba(255, 49, 49, 0.3);
      }
    }

    @keyframes glitch {
      0%, 90%, 100% {
        opacity: 0;
        transform: translateX(0);
      }
      91%, 94% {
        opacity: 0.8;
        transform: translateX(-2px);
        clip-path: inset(0 0 85% 0);
      }
      92%, 93% {
        opacity: 0.6;
        transform: translateX(2px);
        clip-path: inset(15% 0 70% 0);
      }
    }

    @keyframes scanLine {
      0% {
        transform: translateY(-100vh);
      }
      100% {
        transform: translateY(100vh);
      }
    }

    @keyframes gridPulse {
      0%, 100% {
        opacity: 0.3;
      }
      50% {
        opacity: 0.6;
      }
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-20px);
      }
    }

    @keyframes rotate {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes rotateReverse {
      from {
        transform: translate(-50%, -50%) rotate(0deg);
      }
      to {
        transform: translate(-50%, -50%) rotate(-360deg);
      }
    }

    @keyframes pulse {
      0%, 100% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }
      50% {
        transform: translate(-50%, -50%) scale(1.2);
        opacity: 0.7;
      }
    }

    @keyframes buttonSweep {
      0% {
        left: -100%;
      }
      50% {
        left: 100%;
      }
      100% {
        left: 100%;
      }
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-10px);
      }
      60% {
        transform: translateY(-5px);
      }
    }

    @keyframes statusPulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.7;
        transform: scale(1.2);
      }
    }

    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }

    .cyberpunk-terminal {
      display: flex;
      position: relative;
      min-height: 100vh;
      background-color: rgb(0, 0, 0);
      overflow: hidden;
      align-items: center;
      justify-content: center;
      font-family: 'JetBrains Mono', monospace;
    }

    .grid-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image:
        linear-gradient(rgba(255, 49, 49, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 49, 49, 0.1) 1px, transparent 1px);
      background-size: 50px 50px;
      opacity: 0.3;
      animation: gridPulse 4s ease-in-out infinite;
    }

    .scan-line {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgb(255, 49, 49), transparent);
      box-shadow: 0 0 20px rgb(255, 49, 49);
      animation: scanLine 3s linear infinite;
    }

    .content-container {
      position: relative;
      z-index: 10;
      text-align: center;
      max-width: 1200px;
      padding: 0 20px;
      width: 100%;
    }

    .terminal-header {
      margin-bottom: 32px;
      position: relative;
    }

    .main-title {
      font-size: clamp(2.5rem, 8vw, 6rem);
      font-weight: 800;
      color: rgb(255, 255, 255);
      text-transform: uppercase;
      letter-spacing: -2px;
      line-height: 1.1;
      margin-bottom: 16px;
      text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
      animation: titleGlow 2s ease-in-out infinite alternate;
    }

    .title-word {
      display: inline-block;
    }

    .title-word:nth-child(1) {
      animation: fadeInUp 1s ease-out 0.2s both;
    }

    .title-word:nth-child(2) {
      margin-left: 0.5em;
      animation: fadeInUp 1s ease-out 0.6s both;
    }

    .title-word:nth-child(3) {
      margin-left: 0.5em;
      color: rgb(255, 49, 49);
      animation: fadeInUp 1s ease-out 1s both, redGlow 2s ease-in-out infinite alternate;
    }

    .glitch-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      font-size: clamp(2.5rem, 8vw, 6rem);
      font-weight: 800;
      color: rgb(255, 49, 49);
      text-transform: uppercase;
      letter-spacing: -2px;
      line-height: 1.1;
      opacity: 0;
      animation: glitch 4s infinite;
      clip-path: inset(0 0 95% 0);
    }

    .subtitle {
      font-size: clamp(1rem, 3vw, 1.5rem);
      color: rgba(255, 255, 255, 0.8);
      font-weight: 400;
      margin-bottom: 48px;
      animation: fadeInUp 1s ease-out 1.4s both;
      letter-spacing: 1px;
    }

    .hero-3d-container {
      position: relative;
      width: 300px;
      height: 300px;
      margin: 0 auto 48px;
      border: 2px solid rgba(255, 49, 49, 0.3);
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: float 6s ease-in-out infinite;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .hero-3d-main {
      width: 200px;
      height: 200px;
      background: linear-gradient(45deg, rgba(255, 49, 49, 0.2), rgba(255, 255, 255, 0.1));
      border-radius: 50%;
      position: relative;
      animation: rotate 10s linear infinite;
      box-shadow:
        inset 0 0 50px rgba(255, 49, 49, 0.3),
        0 0 100px rgba(255, 49, 49, 0.2);
    }

    .hero-3d-ring {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 100px;
      height: 100px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      animation: rotateReverse 8s linear infinite;
    }

    .hero-3d-core {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 50px;
      height: 50px;
      background-color: rgb(255, 49, 49);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 20px rgb(255, 49, 49);
      animation: statusPulse 2s ease-in-out infinite;
    }

    .terminal-window {
      align-items: center;
      backdrop-filter: blur(2px);
      background-color: rgba(0, 0, 0, 0.85);
      border-bottom: 2px solid rgb(255, 49, 49);
      border-radius: 4px;
      box-shadow: rgba(255, 49, 49, 0.125) 0px 20px 40px inset, rgba(0, 0, 0, 0.5) 0px 40px 80px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      font-family: 'JetBrains Mono', monospace;
      justify-content: center;
      min-height: 378px;
      position: relative;
      text-align: center;
      transition-duration: 0.3s;
      width: 100%;
      margin-bottom: 48px;
    }

    .terminal-header-bar {
      background-color: rgba(255, 49, 49, 0.1);
      border-bottom: 1px solid rgba(255, 49, 49, 0.6);
      font-size: 11.2px;
      font-weight: 700;
      left: 0px;
      letter-spacing: 2px;
      padding: 4.8px 16px;
      position: absolute;
      right: 0;
      text-align: left;
      text-transform: uppercase;
      top: 0;
    }

    .terminal-content {
      align-items: center;
      display: flex;
      flex-direction: column;
      gap: 14px;
      justify-content: center;
      margin: 40px 0 16px;
      min-height: 140px;
      position: relative;
      width: 100%;
    }

    .terminal-title {
      font-size: 64px;
      font-weight: 800;
      letter-spacing: -1.28px;
      line-height: 70.4px;
      max-width: 100%;
      text-align: center;
      text-shadow: rgba(255, 255, 255, 0.25) 0px 5px;
      text-transform: uppercase;
      transition-duration: 0.3s;
      word-break: break-word;
    }

    .cursor {
      animation: blink 1.2s steps(1) infinite;
      background-color: rgb(255, 49, 49);
      border-radius: 1px;
      box-shadow: rgba(255, 49, 49) 0px 0px 15px;
      height: 16.8px;
      transition-duration: 0.3s;
      width: 16px;
    }

    .run-button {
      align-items: center;
      background-color: rgba(0, 0, 0, 0.9);
      border: 2px solid rgb(255, 49, 49);
      border-radius: 4px;
      box-shadow: rgba(255, 49, 49) 0px 0px 20px;
      cursor: pointer;
      display: flex;
      font-family: 'JetBrains Mono', monospace;
      font-size: 20px;
      font-weight: 700;
      justify-content: center;
      letter-spacing: 1px;
      margin-top: 16px;
      max-width: 300px;
      min-height: 50px;
      padding: 12px 32px;
      text-transform: uppercase;
      transition-duration: 0.3s;
      width: 100%;
    }

    .status-bar {
      align-items: center;
      bottom: 0px;
      display: flex;
      flex-wrap: wrap;
      font-size: 10.4px;
      gap: 8px;
      justify-content: space-between;
      left: 0;
      padding: 12px 24px;
      pointer-events: none;
      position: absolute;
      right: 0;
    }

    .status-live {
      align-items: center;
      color: rgb(255, 49, 49);
      display: flex;
      font-size: 10.4px;
      font-weight: 700;
      gap: 4.8px;
      letter-spacing: 1px;
      pointer-events: none;
      text-transform: uppercase;
    }

    .action-button {
      background-color: rgba(0, 0, 0, 0.9);
      border: 2px solid rgb(255, 49, 49);
      border-radius: 4px;
      color: rgb(255, 255, 255);
      font-size: 18px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      padding: 16px 48px;
      text-transform: uppercase;
      letter-spacing: 2px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
      animation: fadeInUp 1s ease-out 1.8s both;
      box-shadow: 0 0 20px rgba(255, 49, 49, 0.3);
    }

    .button-sweep {
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 49, 49, 0.3), transparent);
      animation: buttonSweep 3s ease-in-out infinite;
    }

    .scroll-icon {
      margin-left: 12px;
      animation: bounce 2s infinite;
    }

    .hero-status {
      position: absolute;
      bottom: 32px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 24px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
      font-family: 'JetBrains Mono', monospace;
      animation: fadeInUp 1s ease-out 2.2s both;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: statusPulse 2s ease-in-out infinite;
    }

    .status-online {
      background-color: rgb(0, 255, 0);
      box-shadow: 0 0 10px rgb(0, 255, 0);
    }

    .status-ai {
      background-color: rgb(255, 49, 49);
      box-shadow: 0 0 10px rgb(255, 49, 49);
      animation-delay: 0.5s;
    }

    @media (max-width: 640px) {
      .hero-3d-container {
        width: 250px !important;
        height: 250px !important;
      }
      .hero-3d-main {
        width: 150px !important;
        height: 150px !important;
      }
      .hero-3d-ring {
        width: 75px !important;
        height: 75px !important;
      }
      .hero-3d-core {
        width: 35px !important;
        height: 35px !important;
      }
      .hero-status {
        flex-direction: column !important;
        gap: 16px !important;
      }
    }
  `);

  return (
    <section class="cyberpunk-terminal">
      <div class="grid-background"></div>
      <div class="scan-line"></div>

      <div class="content-container">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; width: 100%; max-width: 1400px;">
          {/* Terminal 1 */}
          <div class="terminal-window">
            <div class="terminal-header-bar">
              <span>RUN:REBEL &gt; SYSTEM READY</span>
            </div>

            <div class="terminal-content">
              <div class="terminal-title" style="font-size: 48px; line-height: 52px;">
                <p>FORGE THE FUTURE. BREAK THE CODE. CLAIM YOUR DESTINY.</p>
              </div>
              <div style="align-items: center; display: flex; justify-content: center; min-height: 32px; width: 100%;">
                <span class="cursor"></span>
              </div>
            </div>

            <button class="run-button">
              <span style="position: relative; z-index: 2;">RUN: REBEL</span>
            </button>

            <div class="status-bar">
              <div>LAT: 42.8770° N | LON: 8.5475° W</div>
              <div class="status-live">LIVE</div>
            </div>
          </div>

          {/* Terminal 2 */}
          <div class="terminal-window">
            <div class="terminal-header-bar">
              <span>RUN:NEXUS &gt; CORE ACTIVE</span>
            </div>

            <div class="terminal-content">
              <div class="terminal-title" style="font-size: 48px; line-height: 52px;">
                <p>BUILD. DEPLOY. DOMINATE. THE DIGITAL REALM.</p>
              </div>
              <div style="align-items: center; display: flex; justify-content: center; min-height: 32px; width: 100%;">
                <span class="cursor" style="animation-delay: 0.6s;"></span>
              </div>
            </div>

            <button class="run-button" style="background-color: rgba(0, 255, 136, 0.1); border-color: rgb(0, 255, 136); box-shadow: rgba(0, 255, 136, 0.3) 0px 0px 20px;">
              <span style="position: relative; z-index: 2; color: rgb(0, 255, 136);">RUN: NEXUS</span>
            </button>

            <div class="status-bar">
              <div>GRID: 51.5074° N | LON: 0.1278° W</div>
              <div style="color: rgb(0, 255, 136); font-weight: 700; gap: 4.8px; letter-spacing: 1px; text-transform: uppercase; display: flex; align-items: center;">
                ACTIVE
              </div>
            </div>
          </div>
        </div>

        <div class="terminal-header">
          <h1 class="main-title">
            <span class="title-word">BUILD</span>
            <span class="title-word">YOUR</span>
            <span class="title-word">DREAMS</span>
          </h1>
          <div class="glitch-overlay">BUILD YOUR DREAMS</div>
        </div>

        <p class="subtitle">AI-POWERED CREATIVITY FOR THE NEXT GENERATION</p>

        <div class="hero-3d-container">
          <div class="hero-3d-main">
            <div class="hero-3d-ring"></div>
            <div class="hero-3d-core"></div>
          </div>
        </div>

        <button class="action-button">
          <span style="position: relative; z-index: 2;">SCROLL TO EXPLORE</span>
          <div class="button-sweep"></div>
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="scroll-icon"
          >
            <path d="M11 5V17" stroke="white" stroke-width="2" stroke-linecap="round"></path>
            <path
              d="M6 12L11 17L16 12"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
            ></path>
          </svg>
        </button>

        <div class="hero-status">
          <div class="status-indicator">
            <div class="status-dot status-online"></div>
            <span>SYSTEM ONLINE</span>
          </div>
          <div class="status-indicator">
            <div class="status-dot status-ai"></div>
            <span>AI READY</span>
          </div>
        </div>
      </div>
    </section>
  );
});
