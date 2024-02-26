const toast = document.getElementById('toast')
const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toast)
let downloadFile = "";
let messageProgress = "";


const socket = new WebSocket('ws://localhost:4080');

socket.addEventListener('open', function (event) {
    console.log('WebSocket is connected')
});

socket.addEventListener('message', function (event) {
    const data = JSON.parse(event.data);

    console.log('data', data);

    msg = data.msg;
    fileNumber = data.fileNumber;
    totalFiles = data.totalFiles;
    step = data.step;
    steps = data.steps;

    if (data.step === 1) {
        $('#progress-bar-step-1').removeClass('hide');
        $('#progress-bar-step-1 .progress-bar-step-1').css('width', fileNumber / totalFiles * 100 + '%');
        $('#progress-bar-step-1 .progress-bar-step-1').attr('aria-valuetext', fileNumber);
        $('#progress-bar-step-1 .progress-bar-step-1').attr('aria-valuemax', totalFiles);
        $('.msg-progress-step-1 span').text(`Etapa ${step}: ${msg}`);

        if (fileNumber === totalFiles) {
            $('#progress-bar-step-1 .progress-bar-step-1').addClass('bg-success');
        }
    }

    if (data.step === 2) {
        $('#progress-bar-step-2').removeClass('hide');
        $('#progress-bar-step-2 .progress-bar-step-2').css('width', fileNumber / totalFiles * 100 + '%');
        $('#progress-bar-step-2 .progress-bar-step-2').attr('aria-valuetext', fileNumber);
        $('#progress-bar-step-2 .progress-bar-step-2').attr('aria-valuemax', totalFiles);
        $('.msg-progress-step-2 span').text(`Etapa ${step}: ${msg}`);

        if (fileNumber === totalFiles) {
            $('#progress-bar-step-2 .progress-bar-step-2').addClass('bg-success');
        }
    }

    if (data.step === 3) {
        $('#progress-bar-step-3').removeClass('hide');
        $('#progress-bar-step-3 .progress-bar-step-3').css('width', fileNumber / totalFiles * 100 + '%');
        $('#progress-bar-step-3 .progress-bar-step-3').attr('aria-valuetext', fileNumber);
        $('#progress-bar-step-3 .progress-bar-step-3').attr('aria-valuemax', totalFiles);
        $('.msg-progress-step-3 span').text(`Etapa ${step}: ${msg}`);

        if (fileNumber === totalFiles) {
            $('#progress-bar-step-3 .progress-bar-step-3').addClass('bg-success');
        }
    }
});

$(document).ready(function () {
    $('#uploadForm').submit(function (e) {
        e.preventDefault();
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

                progress = 100;

                window.open('/download?zipToDownload=' + zipName);

                toastBootstrap.show()
                $('#toast .toast-header strong').text('Success');
                $('#toast .toast-body').text(data.message);
                $('#toast .toast-header').css({
                    'background-color': '#90CC90',
                    'color': 'white'
                })

                document.getElementById('directoryInput').value = '';

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
