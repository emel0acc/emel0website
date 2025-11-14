// Loading Screen
document.addEventListener('DOMContentLoaded', function() {
    const loadingScreen = document.getElementById('loading-screen');
    
    // Hide loading screen after page loads
    window.addEventListener('load', function() {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            
            // Remove from DOM after transition completes
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 1000); // Show loading for minimum 1 second
    });
    
    // Fallback in case load event doesn't fire
    setTimeout(() => {
        if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }, 3000);
});

// Dark/Light Mode Toggle
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('i');
    
    // Check for saved theme preference or respect OS preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (!prefersDark) {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    
    // Update icon based on current theme
    updateThemeIcon();
    
    // Toggle theme on button click
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        updateThemeIcon();
        
        // Add subtle animation to toggle button
        themeToggle.style.transform = 'scale(0.9)';
        setTimeout(() => {
            themeToggle.style.transform = 'scale(1)';
        }, 150);
    });
    
    function updateThemeIcon() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'light') {
            themeIcon.className = 'fas fa-sun';
        } else {
            themeIcon.className = 'fas fa-moon';
        }
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            updateThemeIcon();
        }
    });
});

// ---------------------------
//  FETCH RELEASES FROM SUPABASE
// ---------------------------
document.addEventListener('DOMContentLoaded', function() {
    async function fetchReleases() {
        if (typeof SUPABASE === 'undefined') {
        console.error('Supabase not initialized');
        return [];
        }

        const { data, error } = await SUPABASE
            .from("releases")
            .select("*")
            .order("release_date", { ascending: false });

        if (error) {
            console.error("Error fetching releases:", error);
            return [];
        }

        return data || [];
    }

    // ---------------------------
    //  POPULATE CAROUSEL
    // ---------------------------

    function populateCarousel(releases) {
        const track = document.querySelector(".carousel-track");

        if (!track) return;

        if (releases.length === 0) {
            track.innerHTML = `<p class="empty-message">No releases yet.</p>`;
            return;
        }

        track.innerHTML = "";

        // Build the carousel items
        track.innerHTML = releases.map(release => `
            <div class="carousel-item">
                <div class="release-artwork">
                    <img src="${release.artwork_url}" alt="${release.title}">
                </div>
                <div class="release-info">
                    <h3>${release.title}</h3>
                    <p>${release.description || ""}</p>

                    <div class="streaming-links">
                        ${release.spotify ? `
                            <a href="${release.spotify}" target="_blank">
                                <i class="fa-brands fa-spotify"></i>
                            </a>` : ""}

                        ${release.apple_music ? `
                            <a href="${release.apple_music}" target="_blank">
                                <i class="fa-brands fa-apple"></i>
                            </a>` : ""}

                        ${release.youtube ? `
                            <a href="${release.youtube}" target="_blank">
                                <i class="fa-brands fa-youtube"></i>
                            </a>` : ""}
                    </div>
                </div>
            </div>
        `).join("");

        setupCarousel();
    }

// ---------------------------
//  CAROUSEL LOGIC
// ---------------------------

    function setupCarousel() {
        const track = document.querySelector(".carousel-track");
        const items = document.querySelectorAll(".carousel-item");
        const nextBtn = document.querySelector(".carousel-btn.next");
        const prevBtn = document.querySelector(".carousel-btn.prev");

        if (!track || items.length === 0) return;

        let index = 0;

        function updateCarousel() {
            const width = items[0].getBoundingClientRect().width;
            track.style.transform = `translateX(-${index * width}px)`;
        }

        nextBtn.addEventListener("click", () => {
            index = (index + 1) % items.length;
            updateCarousel();
        });

        prevBtn.addEventListener("click", () => {
            index = (index - 1 + items.length) % items.length;
            updateCarousel();
        });

        window.addEventListener("resize", updateCarousel);
    }

// ---------------------------
//  POPULATE LATEST RELEASE SECTION
// ---------------------------

    async function fillLatestRelease() {
        const { data: releases, error } = await SUPABASE
            .from("releases")
            .select("*")
            .order("release_date", { ascending: false })
            .limit(1); // only get the latest release

        if (error) {
            console.error("Error fetching latest release:", error);
            return;
        }

        if (!releases || releases.length === 0) return;

        const latest = releases[0];

        // Update artwork, title, and description
        const artworkEl = document.getElementById("latest-artwork");
        const titleEl = document.getElementById("latest-title");
        const descEl = document.getElementById("latest-description");
        const linksContainer = document.getElementById("latest-links");

        if (!artworkEl || !titleEl || !descEl || !linksContainer) return;

        artworkEl.src = latest.artwork_url || latest.cover_url || "";
        titleEl.textContent = latest.title;
        descEl.textContent = latest.description || "A new release from emel0.";

        // Clear previous links
        linksContainer.innerHTML = "";

        // Build streaming links dynamically
        const streamingLinks = [
            { url: latest.spotify_url || latest.spotify, icon: "fab fa-spotify", label: "Spotify" },
            { url: latest.apple_url || latest.apple_music, icon: "fab fa-apple", label: "Apple Music" },
            { url: latest.bandcamp_url, icon: "fab fa-bandcamp", label: "Bandcamp" },
            { url: latest.deezer_url, icon: "fab fa-deezer", label: "Deezer" },
            { url: latest.youtube, icon: "fab fa-youtube", label: "YouTube" }
        ];

        streamingLinks.forEach(link => {
            if (!link.url) return;

            const a = document.createElement("a");
            a.href = link.url;
            a.target = "_blank";
            a.classList.add("streaming-link"); // matches your CSS
            a.innerHTML = `<i class="${link.icon}"></i>`;
            linksContainer.appendChild(a);
        });
    }

// ---------------------------
//  ABOUT PREVIEW
// ---------------------------

    function setAboutPreview() {
        const teaser =
            "emel0 creates genre-fluid electronic and neoclassical pieces built around texture, space, and movement — always evolving, always shifting.";

        document.getElementById("about-teaser").textContent = teaser;
    }

// ---------------------------
//  BLOG / NOTES PREVIEW
// ---------------------------

    async function fetchNotes() {
        const { data, error } = await SUPABASE
            .from("notes")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(3);

        if (error) return [];

        return data || [];
    }

    async function populateNotes() {
        const notesList = document.querySelector(".notes-list");

        if (!notesList) return;

        const notes = await fetchNotes();

        if (notes.length === 0) {
            notesList.innerHTML = `<p class="empty-message">Nothing here yet.</p>`;
            return;
        }

        notesList.innerHTML = "";

        notes.forEach(n => {
            const card = document.createElement("div");
            card.classList.add("note-card");

            card.innerHTML = `
                <h4>${n.title}</h4>
                <p>${n.preview_text}</p>
            `;

            notesList.appendChild(card);
        });
    }

// ---------------------------
//  FOOTER YEAR
// ---------------------------

    document.getElementById("current-year").textContent = new Date().getFullYear();

// ---------------------------
//  MAIN INITIALIZATION
// ---------------------------

    async function init() {
        const releases = await fetchReleases();

        populateCarousel(releases);
        fillLatestRelease(releases);
        setAboutPreview();
        populateNotes();
    }

    init();
});
