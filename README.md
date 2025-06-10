# Problem statement

We want to build a dummy business intelligence dashboard that has a filter functionality and displays data. We want to mimic the functionality of filters and display data based on the filters. 

# Details
Instead of products, we will just have numbers and instead of attributes we will just have modulo X as the feature. 

# Data table
Displays all the data in the table with Pagination(100 rows per page) and scrolling(show only 20 entries at a time)

# Dropdown filter
1. Have filters one for each column name(similar to the example in DataStudio) each one should support search and multi-select. 
2. Added search support

# Filter ←→ Table interaction
If we select some values in the filter for a column, all the data will be filtered to only those that match the column.  

# Filter ←→ Filter interaction
1. If we select some columns in a filter for column A(say modulo 3 for example), 
    1. the other columns (modulo 4, modulo 5,modulo 6) update their drop-down to only show relevant rows that have some overlap with the selected column in column A. 
    2. column A have all the values but only the ones we selected will be checked. 
    3. As an example if only numbers that are 2 modulo 3 are selected, then it only show 1 and 3 as options in the modulo 6 filter.

# Performance
The filters should be performant and should not take more than a few milliseconds to do the action. To test the limits of performance, we will change the data set to this with larger filter values.

# Data
For the first part of testing, small data set is used.
For final performance testing, large data set with 50,000 rows is used (the filter column names are different)

## Features

1. Tech stack: ReactJs with Typescript is used.
2. Each component must be independent of the error state of its parent, child, or neighboring components.
3. Use of state management like context for bookmark management is used.
4. Performance is taken care
5. Code should be structured well, must follow the consistent naming convention. 
6. Configurable components 
7. Use strict TypeScript.
8. Use a set of [unit test cases](https://jestjs.io/docs/next/getting-started) wherever applicable.