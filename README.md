# tumblr_mailer
fetches posts from a tumblr, creates custom emails containing references to posts, and emails them to a given list of recipients 

user must provide a list of contacts in "friend_list.csv" with entries for first name, last name, months since last contact and email 

user must provide an email template in "template.ejs" in ejs format which will be rendered using contact and tumblr information

user must supply their own tumblr and mandrill api keys
