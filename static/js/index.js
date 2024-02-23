const toast = document.getElementById('toast')
const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toast)
let downloadFile = "";

$(document).ready(function () {
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
                const { zipName } =  data.data
                downloadFile = zipName;

                setTimeout(() => {
                    window.open('/download?zipToDownload=' + zipName);
                }, 2500);

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
                $('.spinner-overlay').addClass('hide');
            },
            error: function (error) {
                toastBootstrap.show()

                $('.spinner-overlay').addClass('hide');
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
});
