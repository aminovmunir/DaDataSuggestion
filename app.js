class DaDataSuggestion extends HTMLElement {
  
    constructor() {
      super()
      this.suggestions = undefined
    }

    connectedCallback(){
        this.innerHTML =
        `<div class="dadata__container">
          <input class="suggestion__input" type="text" placeholder="Введите название, ИНН, ОГРН или адрес организации"/>
          <div class="suggestions__wrapper">
          <div class="dropdown">
          </div>
        </div>
        <style>
          *{
            box-sizing: border-box;
          }
          
          div {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
           min-width: 300px;
          }
          
          input {
           width: 100%;
           font-size: 16px;
           padding: 4px;
          }
          
          .suggestions__wrapper {
            width: 100%;
            position: relative;
            margin: 0;
            padding: 0;
            vertical-align: top;
            -webkit-text-size-adjust: 100%;
          }
          
          .dropdown {
            display: none;
            border: 1px solid #999;
            min-width: 100%;
            box-sizing: border-box;
            position: absolute;
            top: 0;
            left: 0;
            background-color: #fff;
          }
          
          .dropdown.opened {
            display: block;
          }
          
          .dropdown .placeholder {
            padding: 5px;
            color: #999;
            font-size: 14px;
          }
          
          .dropdown__item {
            padding: 5px;
          }
          
          .dropdown__item:hover {
            background-color: #eeeeee;
          }
          
          .dropdown__item .title {
            text-transform: uppercase;
          }
          
          .dropdown__item .subtitle {
            color: #777;
          }
          
          .title span, .subtitle span {
            color: #00C0FF;
          } 
          
        </style>
        `
        const input = this.querySelector('.suggestion__input')
        const dropdown = this.querySelector('.dropdown')

        const fetchSuggestions = async (query) => {
            let url = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party";
            let token = "b16f3a129675daaab8927746eb9d934455ddc902";

            let options = {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": "Token " + token
                },
                body: JSON.stringify({query: query, count: 5})
            }
            
            let response = await fetch(url, options)
            if (response.ok) {
                let data = await response.json()
                return data
            } else if (!response.ok) {
                let err = await response.text()
                console.log(err);
            }
        }

        const addDropdownItems = (suggestions) => {
            if (suggestions.length > 0) {
                dropdown.innerHTML = '<span class="placeholder">Выберите вариант или продолжите ввод</span>'
                suggestions.forEach((suggestion, index) => {
                    let title = suggestion.data.name.short_with_opf
                    let subtitle = suggestion.data.kpp + ' ' + suggestion.data.address.value
                    dropdown.innerHTML += `
                    <div class="dropdown__item" data-index="${index}">
                        <div class="title">
                            ${title}
                        </div>
                        <div class="subtitle">
                            ${subtitle}
                        </div>
                    </div>
                    `
                });
            }
        }

        const closeDropdown = (e) => {
            if (!e.target.classList.contains('suggestion__input') && !e.target.classList.contains('placeholder')) {
                dropdown.classList.remove('opened')
                window.removeEventListener('click', closeDropdown)
            }
        }

        input.addEventListener('click', (e) => {
            e.stopPropagation()
            if (e.target.value.length > 0) {
                dropdown.classList.add('opened')
                window.addEventListener('click', closeDropdown)
            }
        })

        input.addEventListener('input', async (e) => {
            if (e.target.value.length > 0) {
                this.query = e.target.value
                this.suggestions = await fetchSuggestions(e.target.value)
                this.suggestions = this.suggestions.suggestions
                addDropdownItems(this.suggestions)
                dropdown.classList.add('opened')
                window.addEventListener('click', closeDropdown)
            } else { 
                dropdown.classList.remove('opened')
            }
        })
        
        dropdown.addEventListener('click', (e) => {
            let dropdownItem = e.target.closest('.dropdown__item');
            if (!dropdownItem) return
            input.value = this.suggestions[dropdownItem.dataset.index].data.name.short_with_opf
            if (dropdownItem) {
                let event = new CustomEvent('dropdownselect', {
                    detail: this.suggestions[dropdownItem.dataset.index]
                })
                this.dispatchEvent(event)
                dropdown.classList.remove('opened')
            }
        })
    }

  }

  function typeDescription(type) {
    var TYPES = {
      'INDIVIDUAL': 'Индивидуальный предприниматель',
      'LEGAL': 'Организация'
    }
    return TYPES[type];
  }

  customElements.define("dadata-suggestion", DaDataSuggestion)

  document.querySelector('dadata-suggestion').addEventListener('dropdownselect', (e) => {
    let suggestion = e.detail
    document.getElementById('type').innerHTML = typeDescription(suggestion.data.type) + " (" + suggestion.data.type + ")"
    document.getElementById('name_short').value = suggestion.data.name.short_with_opf
    document.getElementById('name_full').value = suggestion.data.name.full_with_opf
    document.getElementById('inn_kpp').value = suggestion.data.inn + ' / ' + suggestion.data.kpp
    document.getElementById('address').value = suggestion.data.address.unrestricted_value
  })
  