const toast = document.getElementById('toast')
const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toast)
let downloadFile = "";
let WS_HOST = "";
let WS_PORT = "";
let socket;

const handleWebSocket = async () => {
    $.ajax({
        url: '/ws',
        type: 'GET',
        success: async function (data) {
            socket = await new WebSocket(`wss://${data.wsHost}:${data.wsPort}`);

            socket.addEventListener('open', function (event) {
                console.log('WebSocket is connected');
            });

            socket.addEventListener('message', function (event) {
                const data = JSON.parse(event.data);

                msg = data.msg;
                step = data.step;
                steps = data.steps;

                $('.spinner-overlay').addClass('hide');
                $('#progress-bar').removeClass('hide');
                $('#progress-bar .progress-bar').css('width', step / steps * 100 + '%');
                $('#progress-bar .progress-bar').attr('aria-valuetext', step);
                $('#progress-bar .progress-bar').attr('aria-valuemax', steps);
                $('.msg-progress span').text(`Etapa ${step} de ${steps}: ${msg}`);

                if (step === steps) {
                    $('#progress-bar .progress-bar').addClass('bg-success');
                }
            });
        },
    });
};

$(document).ready(function () {

    handleWebSocket();

    $('#uploadForm').submit(function (e) {
        e.preventDefault();
        $('.spinner-overlay').removeClass('hide');
        $('#button-sign').addClass('hide');

        const formData = new FormData(this);

        $.ajax({
            url: '/process-files',
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            timeout: 0,
            success: function (data) {
                const { zipName } = data.data
                downloadFile = zipName;

                window.open('/download?zipToDownload=' + zipName);

                toastBootstrap.show()
                $('#toast .toast-header strong').text('Success');
                $('#toast .toast-body').text(data.message);
                $('#toast .toast-header').css({
                    'background-color': '#90CC90',
                    'color': 'white'
                })

                document.getElementById('directoryInput').value = '';

                $('.spinner-overlay').addClass('hide');
                $('#button-clear').removeClass('hide');
                $('#button-download').removeClass('hide');
            },
            error: function (error) {
                toastBootstrap.show()

                $('#toast .toast-header').css({
                    'background-color': 'tomato',
                    'color': 'white'
                })
                $('#toast .toast-header strong').text(error.statusText);
                $('#toast .toast-body').text(error.responseJSON.message);
            }
        });
    });

    $('#button-clear').click(function () {
        $('#progress-bar').addClass('hide');
        $('.spinner-overlay').removeClass('hide');

        $.ajax({
            url: '/delete-files',
            timeout: 0,
            type: 'DELETE',
            success: function (data) {
                toastBootstrap.show()
                $('#toast .toast-header strong').text('Success');
                $('#toast .toast-body').text(data);
                $('#toast .toast-header').css({
                    'background-color': '#90CC90',
                    'color': 'white'
                })

                document.getElementById('directoryInput').value = '';
                document.getElementById('pfxFile').value = '';
                document.getElementById('password').value = '';

                $('#button-clear').addClass('hide');
                $('#button-download').addClass('hide');
                $('#button-sign').removeClass('hide');
                $('.spinner-overlay').addClass('hide');
                $('#progress-bar-step-1').addClass('hide');
                $('#progress-bar-step-2').addClass('hide');
                $('#progress-bar-step-3').addClass('hide');

                location.reload();
            },
            error: function (error) {
                toastBootstrap.show()
                $('#toast .toast-header').css({
                    'background-color': 'tomato',
                    'color': 'white'
                })
                $('#toast .toast-header strong').text(error.statusText);
                $('#toast .toast-body').text(error.responseJSON.message);
                $('.spinner-overlay').addClass('hide');
            }
        });
    });

    $('#button-download').click(function () {
        $('.spinner-overlay').removeClass('hide');

        $.ajax({
            url: '/download?zipToDownload=' + downloadFile,
            type: 'GET',
            timeout: 0,
            success: function (data) {
                toastBootstrap.show()
                $('#toast .toast-header strong').text('Success');
                $('#toast .toast-body').text(data.message);
                $('#toast .toast-header').css({
                    'background-color': '#90CC90',
                    'color': 'white'
                })

                $('.spinner-overlay').addClass('hide');
                $('#button-sign').addClass('hide');
            },
            error: function (error) {
                toastBootstrap.show()
                $('.spinner-overlay').addClass('hide');
                $('#button-sign').removeClass('hide');

                $('#toast .toast-header').css({
                    'background-color': 'tomato',
                    'color': 'white'
                })
                $('#toast .toast-header strong').text(error.statusText);
                $('#toast .toast-body').text(error.responseJSON.message);
            }
        });

        window.open('/download?zipToDownload=' + downloadFile);
    });

    $('#directoryInput').change(function () {
        if (this.value) {
            $('#button-sign').removeClass('hide');
        } else {
            $('#button-sign').addClass('hide');
        }
    });

    $('[data-toggle="tooltip"]').tooltip();

    $('.toast').toast()

    $('.progres')
});
