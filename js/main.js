var filtersOfProducts = {}
const filters = {
  'pe_cap' : function(pendecy) {
    let $selectFilters = $('select[name=filters-of-products]');
    
    return pendecy.trim().startsWith($selectFilters.val());
  },
  'vem_recife': function(pendency) {
    
    return pendency.trim().startsWith('VEM RECIFE');
  },
  'recargas': function(pendency) {
    
    return !pendency.trim().startsWith('PE Cap')
    && !pendency.trim().startsWith('PE Extra') 
    && !pendency.trim().startsWith('VEM RECIFE')
    && pendency.trim().length > 0;
    
  },
  'balance' : function(pendency) {
    let balance = pendency.balance.replace('-', '');
    balance = balance.replace(',', '.');
    return parseFloat(balance, 10) > 0;
  }
}

var pendencies = [];

function enableSelects(event) 
{
  let $selectProducts = $('select[name=products]');
  let $selectFilters = $('select[name=filters-of-products]');
  $selectProducts.removeAttr('disabled');
  $selectFilters.removeAttr('disabled');
}

function loadFilters(event) 
{
  filtersOfProducts['pe_cap'] = (function() {
    let datesOfPECap = [];
    for (let index = 0; index < pendencies.length; index++) {
      datesOfPECap = datesOfPECap.concat( pendencies[index].pendecy.split(/<br[ ]?[\/]?>/gim) );
    }
    datesOfPECap = datesOfPECap.filter(function(date) {
      
      return date.trim().startsWith('PE Cap') && date.trim().length > 1;
    }).map(function(date) {
      
      return date.trim().match(/PE Cap [0-9]{2}\/[0-9]{2}\/[0-9]{4} [0-9]{2}:[0-9]{2}/)[0];
    }).reduce(function(acumulator, current) {
      let size = acumulator.length;
      for (let index = 0; index < size; index++) {
        if (acumulator[index] === current) {
          
          return acumulator;
        }
      }
      acumulator.push(current);
      
      return acumulator;
    }, []);
    
    return datesOfPECap;
  })();
  filtersOfProducts['recargas'] = ['RECARGAS'];
  filtersOfProducts['vem_recife'] = ['VEM Recife'];
}

function refreshFilters(event) 
{
  let $selectProducts = $('select[name=products]');
  let $selectFilters = $('select[name=filters-of-products]');
  $selectFilters.empty();
  let productSelected = filtersOfProducts[$selectProducts.val()];
  let sizeOfFilters = productSelected.length;
  for (let index = sizeOfFilters - 1; index > -1; index--) {
    $selectFilters.append('<option value="' + productSelected[index]+ '">' + productSelected[index] + '</option>');
  }
}

function runFilter(event) 
{
  let $selectProducts = $('select[name=products]');
  let productSelected = $selectProducts.val();
  let filter = filters[productSelected];
  let pendenciesCache = pendencies;
  for (let index = 0; index < pendenciesCache.length; index++) {
    pendenciesCache[index]['products'] =  pendencies[index].pendecy.split(/<br[ ]?[\/]?>/gim).map(function(pendency) {
      return pendency.trim();
    }).filter(filter) ;
  }
  pendenciesCache = pendenciesCache.filter(function(pendency) {return pendency.products.length > 0;}).
  sort(function(a,b) {
    if (a.collector < b.collector) { return -1;}
    if (a.collector > b.collector) { return 1;}
    return 0;
  });
 
  let $tbody = $('#pendencies');
  $tbody.empty();
  let sum = 0;
  for (let index = 0; index < pendenciesCache.length; index++) {
    let products = '';
    let amount = 0;
    for (let bindex = 0; bindex < pendenciesCache[index].products.length; bindex++) {
      amount += parseFloat( pendenciesCache[index].products[bindex]
        .match(/R\$ [0-9]{1,}[.]?([0-9]{1,})?/)[0]
        .match(/[0-9]{1,}[.]?([0-9]{1,})?/)[0], 10) * 10000;
      
      products += pendenciesCache[index].products[bindex] + '<br>';
    }
    $tbody.append('<tr>' + 
                  '<td>' + pendenciesCache[index].collector  + '</td>' +
                  '<td>' + pendenciesCache[index].sellerName + '</td>' +
                  '<td>' + pendenciesCache[index].terminal   + '</td>' +
                  '<td>' + pendenciesCache[index].lastpayout + '</td>' +
                  '<td>' + products                          + '</td>' +
                  '<td>' + 'R$ ' + (amount / 10000)          + '</td></tr>'
                 );
    sum += amount;
  }
  pendenciesCache = pendencies.filter(filters['balance']);
  $('#balance-product').text('Total da Pendencia: R$ ' + (sum / 10000));
  $tbody = $('#balances');
  $tbody.empty();
  let balances = 0;
  for (let index = 0; index < pendenciesCache.length; index++) {
    let balance = parseFloat(pendenciesCache[index].balance.replace('-', '').replace(',', '.'), 10);
    $tbody.append('<tr>' +  
                  '<td>' + pendenciesCache[index].collector  + '</td>' +
                  '<td>' + pendenciesCache[index].sellerName + '</td>' + 
                  '<td>' + pendenciesCache[index].terminal   + '</td>' +
                  '<td>' + pendenciesCache[index].lastpayout + '</td>' +
                  '<td>' + balance    + '</td>' + 
                  '</tr>');
    balances += balance * 1000;
  }
  $('#balance-balance').text('Total dos Vales: R$ ' + (balances / 1000));
}


function initApp() 
{
  $('input[type=file]').change(function() {
    $('input[type=file]').parse({
      config: {
        complete: function(results) {
          let csv = results.data;
          let size = csv.length - 2;
          for (let index = 1; index < size; index++) {
            let row = csv[index];
            pendencies.push({
              collector: row[0],
              sellerName: row[1],
              terminal: row[5],
              terminal: row[2],
              lastpayout: row[3],
              pendecy: row[4].trim(),
              balance: row[6]
            });
          }
          $('body').trigger('completecsv'); 
        },
        encoding: 'iso-8859-9'
      }
    });
  });
  $('body').on('completecsv', loadFilters);
  $('body').on('completecsv', enableSelects);
  $('body').on('completecsv', refreshFilters);
  $('select[name=products]').change(refreshFilters);
  $('button').click(runFilter);
}


$(document).ready(initApp);