import { useTime } from '../contexts/TimeContext';
import { useTheme } from '../contexts/ThemeContext';

export function ContentArea() {
  const { isPartyTime, message, remainingTime, nextPartyTimeStr } = useTime();
  const { theme } = useTheme();

  return (
    <div className={`content ${isPartyTime ? 'yes' : 'no'}`}>
      <img
        className="icon"
        src={isPartyTime ? theme.fullCart : theme.icon}
        alt="Cart Icon"
      />
      <div className="message">{message}</div>
      <p id="remaining-time">{remainingTime}</p>

      {isPartyTime ? (
        <img
          id="beer-drinking-gif"
          src={theme.gifs.beer}
          alt="Beer drinking animation"
          style={{ position: 'relative', margin: '0 auto' }}
        />
      ) : (
        <div id="waiting-content">
          <p id="waiting-text">
            Speel Karretje the game!!!!! terwijl je wacht tot het vrijdag {nextPartyTimeStr} is!
          </p>
          <a href="./karretje-the-game.html" className="game-link">
            <img src="assets/kar.png" alt="Karretje" />
          </a>
        </div>
      )}
    </div>
  );
}

