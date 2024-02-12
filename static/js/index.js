const toast = document.getElementById('toast')
const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toast)

$(document).ready(function () {
    $('#uploadForm').submit(function (e) {
        e.preventDefault();
        $('#spinner-overlay').removeClass('hide');

        const formData = new FormData(this);

        $.ajax({
            url: '/process-files',
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            success: async function (data) {

                const { zipName } = data.data

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
                $('#spinner-overlay').addClass('hide');
            },
            error: function (error) {
                toastBootstrap.show()

                $('#spinner-overlay').addClass('hide');
                $('#toast .toast-header').css({
                    'background-color': 'tomato',
                    'color': 'white'
                })
                $('#toast .toast-header strong').text(error.statusText);
                $('#toast .toast-body').text(error.responseJSON.message);
            }
        });
    });

    $('[data-toggle="tooltip"]').tooltip();

    $('.toast').toast()
});
