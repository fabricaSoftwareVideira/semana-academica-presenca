// Contador regressivo
function updateCountdown() {
    const eventDate = new Date('2025-11-10T07:30:00').getTime();
    const now = new Date().getTime();
    const distance = eventDate - now;

    if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    } else {
        // document.getElementById('countdown').innerHTML = '<h3 style="color: #4caf50;">🎉 O evento começou! 🎉</h3>';
        document.querySelector('.countdown').remove();
    }
}

// Atualizar contador a cada segundo
setInterval(updateCountdown, 1000);
updateCountdown();