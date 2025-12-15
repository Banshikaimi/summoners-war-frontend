const BACKEND_URL = 'https://summoners-war-backend.onrender.com/api/streamers'; // <-- Mets ton URL Render ici

const pages = {
  home: `
    <h1>Summoner's War : Sky Arena</h1>
    <p class="intro">Le RPG stratégique aux combats intenses et aux monstres légendaires</p>
  `,
  community: `
    <div id="dynamic-content">
      <div id="streamers-list"></div>
    </div>
  `
};

// Menu Hamburger
document.addEventListener('DOMContentLoaded', () => {
  const hamburgerIcon = document.getElementById('hamburgerIcon');
  const sidebar = document.getElementById('sidebar');

  hamburgerIcon.addEventListener('click', e => {
    e.stopPropagation();
    sidebar.classList.toggle('active');
    hamburgerIcon.classList.toggle('active');
  });

  document.addEventListener('click', e => {
    if (!sidebar.contains(e.target) && !hamburgerIcon.contains(e.target)) {
      sidebar.classList.remove('active');
      hamburgerIcon.classList.remove('active');
    }
  });

  document.querySelectorAll('.sidebar-button').forEach(btn => {
    btn.addEventListener('click', () => {
      changePage(btn.getAttribute('data-page'));
      sidebar.classList.remove('active');
      hamburgerIcon.classList.remove('active');
    });
  });

  changePage('home');
});

function changePage(pageName) {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = pages[pageName] || pages.home;

  if (pageName === 'community') {
    showCommunityStreamers();
  }
}

async function showCommunityStreamers() {
  const streamersList = document.getElementById('streamers-list');
  streamersList.innerHTML = `<p>Chargement des streameurs FR...</p>`;

  try {
    const response = await fetch('https://summoners-war-backend.onrender.com/api/streamers');
    const streamers = await response.json();

    if (streamers.length === 0) {
      streamersList.innerHTML = `<p>Aucun streameur francophone en live 😢</p>`;
      return;
    }

    let html = '<h3>🔴 Streameurs Summoner\'s War FR</h3><div class="streamers-list">';
    streamers.forEach(s => {
      html += `
        <div class="streamer-card online">
          <a href="${s.twitchUrl}" target="_blank">
            <img src="${s.thumbnailUrl}" alt="${s.displayName}">
            <h4>${s.displayName}</h4>
            <p>${s.title}</p>
            <p>${s.viewerCount} viewers</p>
          </a>
        </div>
      `;
    });
    html += '</div>';
    streamersList.innerHTML = html;

  } catch (err) {
    streamersList.innerHTML = `<p>Erreur lors du chargement des streameurs</p>`;
    console.error(err);
  }
}
