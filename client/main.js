const urlParams = new URL(window.location).searchParams;
const spid = urlParams.get('spid');
const enablebids = urlParams.get('enablebids');
const orgID = urlParams.get('orgId');
const refresh = document.getElementById('refresh');

const orgIDInput = document.getElementById('orgId');
const username = document.getElementById('username');
const submit_btn = document.getElementById('submit_btn')

const form__ = document.getElementById('form_');

// console.log(phone)

// form__.o

function submitForm(e) {

    const phone = document.getElementById('phone').value;
    const amount = document.getElementById('amount').value;

    const formData = {
        phone: phone,
        spid,
        amount: amount
    }

    if ([...Object.entries(formData)].every(Boolean)) {
      console.log(formData);
  
    fetch(`https://a1cd-102-23-138-170.ngrok-free.app/placebid`, {
      method: 'POST',
      body: formData
    }).then((res) => res.json()).then((res) => {console.log(res);
    if (res.success == true) {
      alert('Your bid has successfully been placed')
    }})
    }
}

submit_btn?.addEventListener('click', (e) => {
    e.preventDefault();
    submitForm()
})



// refresh.addEventListener('click', () => {
//   fetch(`https://a1cd-102-23-138-170.ngrok-free.app/`)
// })